import Handlebars from "handlebars";
import { lewHash32 } from "joto/lib/lewHash";
import { isStr, objectMap, uniqueArray as uniq } from "joto/lib/sys";
import { ExistentObj, microServer } from "./interf/AgMicroServer";
import { agPostText, agPreText } from "./AgStrFn";
import { TplRet, TplEntry, TplFile, TplDir } from "./TplTypes";
import { executeInterpolatedString } from "../../misc/str";
import matter from "gray-matter";
import { Dict, ObjAny } from "joto/lib/jotypes";
import { hajax, hajaxArray } from "./hajax";
import { tplExt } from "./AgEngine";
class AgTpl {
	constructor() {
	}
	private extractSections(path: string, cont: string) {
		const USE_AMPS_AS_SECTIONS = false;
		if (USE_AMPS_AS_SECTIONS) cont = cont.swap(this.ampHolder, `[AND]`);
		const mat = matter(cont);
		const orig_cont = cont;
		cont = mat.content;
		const ret: TplRet = {
			_text: this.postAmpersand(cont),
			_info: ``,
		}
		const amp = this.ampHolder;
		const trueAmp = `${amp}amp;`, fusedAmp = `ªªamp¡`;
		cont = cont.swap(trueAmp, fusedAmp);
		function unAmp(s: string) {
			return s && s.swap(fusedAmp, trueAmp) || ``;
		}
		if (USE_AMPS_AS_SECTIONS && cont.includes(amp)) {
			const hasTopInfo = !cont.startsWith(amp);
			const arr = cont.trim().split(amp);
			if (!arr.length) throw new Error(`Unusual situation, please report this bug with contents: ${cont}`);
			if (arr.length % 2 == 0) throw new Error(`Did you use ampersand sign in this .hbs/.md file incorrectly?\nYou should use it in pairs, to define section names, like this:\n &amp;sectionName&amp; some content \n&amp;otherSection&amp; some other content`);
			while (arr.length && !arr[0]) arr.shift();
			if (hasTopInfo) ret._info = (arr.shift()!).trim();
			while (arr.length) {
				const name = arr.shift()!.trim();
				const val = (arr.shift() || ``).trim();
				// jo(`name`, name, `val`, val);
				if (name) {
					ret[name] = val;
				}
			}
		}
		const forbiddenNames = [`_text`, `_info`];
		const namesMat = Object.keys(mat.data), namesRet = Object.keys(ret);
		namesMat.forEach(name => {
			if (namesRet.includes(name))
				throw new Error(`Can not continue, section name <code>${name}</code> is used both in YAML front matter and in the body of the file <code>${path}</code>. Please rename one of them.`);
		});
		const result = objectMap({ ...mat.data, ...ret }, (v, k) => {
			if (forbiddenNames.includes(k!)) return unAmp(v);
			return isStr(v) ? unAmp(this.postAmpersand(v)) : v;
		}) as TplRet;
		return result;
	}
	private existenceInfo: Dict<ExistentObj> = {};
	async run(basePath: string, path: string, glob: ObjAny, contSrc: string, depth: string[], quick: boolean) {
		// debugger;
		const runRec = async (path: string, cont: string) => {
			if (!path.startsWith(`./`)) path = `./${path}`;
			const prePath = path.cutLast(`/`), name = path;// path.getLast(`/`);
			// debugger;
			return await this.run(prePath, name, glob, cont, [...depth, path], quick);
		}
		const finalize = () => {
			let x = this.handlebarsProc(current, glob);
			// x = agParseLinks(basePath, x);
			x = agPostText(x);

			// x.swap(`{{`, "\\{{");
			return this.extractSections(path, x);
		}
		const toBeReplaced: { entry: TplEntry, replacement: string }[] = [];
		glob = { ...glob };
		let src = this.preAmpersand(contSrc || (await hajax(path, quick)).txt);
		src = agPreText(src);
		let current = src;
		const cwdPath = path.cutLast(`/`);
		const allImports = this.extractImports(current, basePath, cwdPath);
		if (!allImports || !allImports.length) return finalize();
		function dynamicImportTranslation() {
			for (const item of allImports) {
				const txt = item.txt;
				if (txt.includes(`$`)) {
					// item.txt = executeInterpolatedString(item.txt, glob);
					item.fullPath = executeInterpolatedString(item.fullPath, glob);
				}
			}
		}
		dynamicImportTranslation();
		if (allImports.some(x => x.txt === path))
			throw new Error(`Can not continue, circular dependency detected at <code>${path}</code>`);
		if (depth.length > 16)
			throw new Error(`Can not continue, too deep:\n <code>${depth.join(`\n`)}</code>`);

		const info = this.existenceInfo[path] = quick
			? this.existenceInfo[path]
			: await microServer.listNonExistent(uniq(allImports.map(x => x.fullPath)));
		if (!quick) {
			if (info.err)
				throw new Error(`Error: ${info.err}`);
			function checkFailedLen(a: string[], why: string) {
				const one = a.length == 1;
				if (a.length)
					throw new Error(/*html*/`Can not continue, ${why} paths are used:\n\n &bull; <code>${a.join(`\n &bull;`)}</code>\n\nIf you just wanted to use ${one ? `this string` : `these strings`} within double quotes (such as ${a.map(x => `<code>"${x.getLast(`/`)}"</code>`).join(` or `)}) as a parameter, not a path to a file, please enclose it with single quotes instead, as follows: ${a.map(x => `<code>'${x.getLast(`/`)}'</code>`).join(` or `)}. In our flavor of Handlebars, double quotes are reserved for including other hbs files, whereas single quotes are reserved for strings.`);

			}
			checkFailedLen(info.risky, `risky`);
			checkFailedLen(info.failed, `failed`);
			checkFailedLen(info.non, `non-existent`);
		}
		async function processFiles() {
			const filesContArr: TplFile[] = (await Promise.all(info.files.map(x => hajax(x, quick)))).map((x, i) => ({
				fileName: sub(x.url),
				varName: varNm(sub(x.url), x.url),
				cont: x.txt
			}));
			for (const item of allImports) {
				const file = filesContArr.find(x => x.fileName == sub(item.fullPath));
				if (!file) continue;
				prepareReplacer(item, file.varName);
				glob[file.varName] = await runRec(item.fullPath, file.cont);
			}
		}
		async function processDirs() {
			const dirsCont: TplDir[] = [];
			const dirNames = Object.keys(info.dirs);
			for (const dirName of dirNames) {
				const filesList = info.dirs[dirName];
				const filesCont: TplFile[] = (await hajaxArray(filesList.map(x => `${dirName}/${x}`), quick))
					.filter(x => !x.failed)
					.map((x, i) => ({
						fileName: fixName(filesList[i]),
						varName: fixName(filesList[i]),//varNm(filesList[i], dirName + filesList[i]),
						cont: x.txt
					}));
				const dir = {
					dirName,
					varName: varNm(sub(dirName), ``),
					files: filesCont
				};
				const dirObj: Dict<TplRet> = {};
				for (const file of dir.files) {
					dirObj[file.varName] = await runRec(dirName + `/` + file.fileName, file.cont);
				}
				dirsCont.push(dir);
				glob[dir.varName] = dirObj;
			}
			for (const item of allImports) {
				const folder = dirsCont.find(x => x.dirName == item.fullPath);


				if (!folder) continue;
				prepareReplacer(item, folder.varName);
			}
		}
		await Promise.all([processFiles(), processDirs()]);

		runReplacers();
		return finalize();
		function sub(path: string) {
			return fixName(path.slice(basePath.length));
		}
		function fixName(n: string) {
			n = (n.startsWith(`/`) ? n.slice(1) : n);
			tplExt.forEach(ext => n = n.cutLast(ext));
			return n;
		}
		function prepareReplacer(entry: TplEntry, replacement: string) {
			toBeReplaced.push({ entry, replacement });
		}
		function runReplacers() {
			toBeReplaced.sort((a, b) => b.entry.pos - a.entry.pos);
			for (const { entry, replacement } of toBeReplaced)
				current = replaceInString(current, entry, replacement);

		}
	}
	extractImports(src: string, basePath: string, myRelPath: string) {
		// imports are all inside {{ here }} and they all start from % sign:
		let pos = 0, limit = 10000;
		const res: TplEntry[] = [];
		while (limit-- > 0) {
			const start = src.indexOf(`{{`, pos);
			if (start < 0) break;
			const end = src.indexOf(`}}`, start);
			if (end < 0) break;
			const imp = src.slice(start + 2, end).trim();
			// res.push({ txt: imp, pos: start });
			if (imp.includes(`"`)) {
				if (imp.split(`"`).length != 3)
					throw new Error(`Error in the following snippet:\n<code>{{${imp}}}</code>\n\n  Please make sure that all quotes <code>"</code> are paired, as well as all mustaches <code>{{</code> are closed with <code>}}</code>.`);
				const txt = imp.getBetweenClose(`"`, `"`);
				const outPath = (
					txt.startsWith(`./`) ? myRelPath + txt.slice(1)// relative, starting with ./
						: txt.startsWith(`/`) ? (basePath + txt)// absolute, starting with /
							: myRelPath + `/` + txt// relative, starting with just a name
				).swap(`//`, `/`).resolvePaths;
				const obj: TplEntry = {
					fullPath: outPath,
					txt,
					pos: start + imp.indexOf(`"`) + 2
				};
				res.push(obj);
			}
			pos = end + 2;
		}
		// sort by pos desc:
		res.sort((a, b) => b.pos - a.pos);
		return res;
	}
	handlebarsProc(text: string, glob: ObjAny) {
		return Handlebars.compile(text, {
			noEscape: true,
			ignoreStandalone: true,
		})(glob);
	}
	private ampHolder = `¾amp`;
	private preAmpersand(text: string) { return text && text.swap(`&`, this.ampHolder) || ``; }
	private postAmpersand(text: string) {
		return text && text.swap(this.ampHolder, `&`) || ``;
	}
}
function replaceInString(str: string, entry: TplEntry, replacement: string) {
	const from = entry.pos, to = entry.pos + entry.txt.length + 2;
	const a = str.slice(0, from);
	const b = str.slice(to);
	return a + replacement + b;
}
function varNm(path: string, fullPath: string) {
	// replace all non-alphanumeric chars with _:
	return `_` + path.replace(/[^a-zA-Z0-9]/g, `_`)
		+ `_` + lewHash32(path + fullPath, 2)[1].toString(36) + `$`;
}
export const agTpl = new AgTpl();

