/* eslint-disable @typescript-eslint/prefer-regexp-exec */
/* eslint-disable no-cond-assign */
import { getId } from "joto/lib/id";
import { jot, jotB, jotErr } from "joto/lib/jot"
import { Dict, ObjAny } from "joto/lib/jotypes";
import { o2s, o2sB, obj2arrMap, objectMap } from "joto/lib/sys";
import { AgEngine, tplExt } from "./AgEngine";
import { ExeQuery } from "./ExeParam";

const inputUserSplitter = `~~`;

const open = `<`;
const close = `>`;

export function convertAiTextToURL(basePath: string, text: string, id: string) {
	let simple = getEmptyObjLink(id);
	function ret() { return relativePathToAbsolute(basePath, objLinkToURL(simple)); }
	if (!basePath.trim()) return ret();
	const links = getAllTagsBetweenBrackets(text);
	if (links.length) {
		let res: ExeQuery<any> | null = null;
		links.forEach(link => {
			if (!res) res = xmlLinkToObjLink(link, id);
			/// here I need not only to remove the tag, but also to remove spaces before and after it:
			const splitter = (`${open}${link}${close}`);
			let arr = text.split(splitter);
			arr = arr.map((part, i) => {
				if (i === 0) return part.trimEnd();
				if (i === arr.length - 1) return part.trimStart();
				return part.trim();
			});
			text = arr.join(` `);
		});
		if (res) simple = res;
	}
	simple.input.ai = text.swapHard(`  `, ` `).trim();
	return ret();

}


export function convertUrlToAiText(url: string, id: string) {
	const obj = urlToObjLink(url, id);
	return objLinkToAiText(obj);
}

export function objLinkToAiText(obj: ExeQuery<any>) {
	obj.path = obj.path.cutFirst(getBaseAgentPath(obj.path)).cutFirst(`/`);
	let tag = objToXMLTag(obj.path, obj.vars) + ` `;
	if (tag.swap(` `, ``) == `</>`) tag = ``;
	const res = `${tag}${obj.input.ai.trim()}`;
	return res;
}

function objToXMLTag(tag: string, obj: Dict<string>) {
	return `<${tag} ${obj2arrMap(obj, (v, k) => `${k}="${v.htmlEnc}"`).join(` `)} />`;

}

export function testConvertUrlToAiText() {
	const url = `ag://./src/ag.dyn/secretary.ag/task.ts?act=add&title=hello&desc=world#I+added+this+task!`;
	const text = convertUrlToAiText(url, getId());
	jot({ text });
}
export function testConvertAiTextToURL() {
	jot(`convertAiTextToURL: ${o2sB(convertAiTextToURL(`./src/ag.dyn/jordain.ag/`, `hello    <world of="magical wonders">!`, getId()))}`);
}
export function relativePathToAbsolute(basePath: string, path: string) {
	if (path.startsWith(`./`))
		path = path.slice(1);
	if (!basePath.endsWith(`/`)) basePath += `/`;
	return `${AgEngine.PROTOCOL}${basePath}${path}`;
}

export function agParseLinks(basePath: string, text: string, id: string) {
	basePath = basePath.cutFirst(AgEngine.PROTOCOL);
	const links = getAllTagsBetweenBrackets(text);
	// jot(`links: ${o2sB(links)}`);

	for (const link of links) {
		if (link.trim() == `/`) {
			continue;
			// throw new Error(`You have an empty tag somewhere in your prompt-page that looks like this: ${open}${link}${close}\nPlease remove it.`);
		}
		const btn = xmlLinkToButton(link, basePath, id);
		text = text.replace(`${open}${link}${close}`, btn);
	}

	return text;
}

function xmlLinkToObjLink(link: string, id: string) {
	const res = getEmptyObjLink(id);
	if (link.includes(` `)) {
		// here I need to remove space in case if next word starts with a slash:
		const arr = link.split(` `), res: string[] = [];
		arr.forEach((part, i) => {
			if (i === 0) res.push(part);
			else {
				res.push((part.startsWith(`/`) && part.length > 1 ? `` : ` `) + part);
			}
		});
		link = res.join(``);
	}
	if (!link.includes(` `)) {
		res.path = link;
	} else {
		const o = parseXMLTag(`${open}${link}${close}`);
		if (o.notXML)
			res.path = `src:${link}`;
		else {
			res.path = o.tag;
			res.vars = o.attrs;
		}
	}
	// if (link.has(`more`)) debugger;
	return res;

}

export function isValidUrl(url: string) {
	try {
		new URL(url);
		return true;
	} catch (e: any) {
		// throw new Error(`${e.message} for url: "${url}"\n\nThe URL must start with "${AgEngine.PROTOCOL}" or "http://"`);
		return false;
	}
}

export function appendQueryVariablesToUrl(url: string, vars: Record<string, string | number>) {
	const hasUserSplitter = url.has(inputUserSplitter);
	let userInput = ``;
	if (hasUserSplitter) {
		userInput = url.cutFirst(inputUserSplitter);
		url = url.getFirst(inputUserSplitter);
	}
	const protocol = AgEngine.PROTOCOL;
	const hadProtocolInitially = isValidUrl(url);

	const urlObject = new URL((hadProtocolInitially ? `` : protocol) + url);
	for (const [key, value] of Object.entries(vars)) {
		urlObject.searchParams.set(key, value.toString());
	}
	const r = urlObject.toString() + userInput.bake(inputUserSplitter, ``);
	return hadProtocolInitially ? r : r.cutFirst(protocol);
}
(window as any).appendQueryVariablesToUrl = appendQueryVariablesToUrl;

function xmlLinkToButton(link: string, basePath: string, id: string) {
	const res = xmlLinkToObjLink(link, id);
	// jotB(res);
	return `<a class=ag-inline-link onmouseover="${`window._ag_open_link(this, ${o2s(res)}, ${o2s(basePath)})`.htmlEnc}">${open.htmlEnc}${link}${close.htmlEnc}</a>`;
}
function getEmptyObjLink(id: string): ExeQuery<any> {
	return {
		path: ``,
		vars: {},
		input: { ai: ``, user: ``, id },
	}
}


function getAllTagsBetweenBrackets(text: string) {
	const res = [];
	let i = 0;
	const alpha = `[A-Za-z]`;
	while (i < text.length) {
		const o = text.indexOfRegEx(new RegExp(`${open}${alpha}`), i);
		// const o = text.indexOf(open, i);
		if (o === -1) break;
		// const c = text.indexOf(`${alpha}${close}`, o);// wrong! It should be any > now
		const c = text.indexOf(close, o);
		if (c === -1) break;
		res.push(text.slice(o + open.length, c));
		i = c + close.length;
	}
	return res;
}

function parseXMLTag(tagString: string): { tag: string, attrs: { [key: string]: string }, notXML?: boolean } {

	try {
		const tag = tagString.match(/<([^\s>]+)/)![1];
		const attrs: { [key: string]: string } = {};

		const attrRegex = /(\w+)=("[^"]+"|\w+)/g;
		let match: RegExpExecArray | null;
		while (match = attrRegex.exec(tagString)) {
			attrs[match[1]] = match[2].replace(/^"|"$/g, '');
		}

		return { tag, attrs };
	} catch (e) {
		return { tag: tagString, attrs: {}, notXML: true };
		throw e;
	}
}

export function objLinkToURL(link: ExeQuery<any>) {
	const vars = Object.keys(link.vars).map(key => {
		return `${key.urlEncSimple}=${(link.vars as any)[key].urlEncSimple}`;
	});
	return `${link.path}${vars.join(`&`).bake(`?`)}${link.input.ai.urlEncSimple.bake(`#`)}`;
}

export function urlToObjLink(url: string, id: string) {
	const res = getEmptyObjLink(id);
	res.path = getUrlPath(url);
	res.vars = getUrlVars(url);
	res.input.ai = getUrlInputAI(url);
	res.input.user = getUrlInputUser(url);
	res.input.id = id;
	return res;
}


export function getUrlPath(url: string) {
	url = url.getFirst(`?`).getFirst(`#`).cutLast(inputUserSplitter);
	const cutIf = (x: string) => { if (url.endsWith(x)) url = url.cutLast(x); }
	cutIf(`/`);
	cutIf(`.ts`);
	tplExt.forEach(cutIf);
	return url;
}
export function getUrlVars(url: string, alreadyStripped = false, doNotRemoveVisitedKey = false) {
	url = url.getFirst(inputUserSplitter);
	if (!url.includes(`?`) && !alreadyStripped) return {};
	const vars = alreadyStripped ? url : url.cutFirst(`?`).getFirst(`#`).getFirst(inputUserSplitter);
	if (!vars) return {};
	const res: Record<string, string> = {};
	vars.split(`&`).forEach((v) => {
		const [key, val] = v.split(`=`);
		if (doNotRemoveVisitedKey || key != AgEngine.revisitKey)
			res[key.urlDec] = val.urlDec;
	});
	return res;
}
function getUrlTextRaw(url: string, spl: string) {
	if (!url.includes(spl)) return ``;
	return url.cutFirst(spl).urlDec;
}
export function getUrlInputAI(url: string) {
	return getUrlTextRaw(url, `#`);
}

export function getUrlInputUser(url: string) {
	return getUrlTextRaw(url, inputUserSplitter);
}
export function getBaseAgentPath(url: string) {
	const ext = AgEngine.PROJ_EXT;
	const allExts = [`.ts`, ...tplExt], candidate = `.` + url.getLast(`.`);
	if (allExts.includes(candidate)) {
		url = url.cutLast(`.`);
	}
	if (url.endsWith(ext) && !url.has(`#`) && !url.has(`?`) && !url.has(inputUserSplitter)) url += `/`;
	const cutIfHas = (x: string, def = ``) => { return url.has(x) ? url.cutLast(x) : def; }
	return cutIfHas(`${ext}/`, cutIfHas(`${ext}${inputUserSplitter}`)) + `${ext}`;
}
export function getAgentName(url: string) {
	const base = getBaseAgentPath(url);
	return base.getLast(`/`);
}


export function getAgDirFile(url: string) {
	// if (url.has(`John`)) debugger;
	const cutIfHas = (x: string) => { url = url.has(x) ? url.cutLast(x) : url; }
	cutIfHas(`.ts`);
	tplExt.forEach(cutIfHas);
	cutIfHas(inputUserSplitter);
	cutIfHas(`#`);
	cutIfHas(`?`);
	return url.slice(getBaseAgentPath(url).length).cutFirst(`/`);

}


/**
 * this is a system object with parameters for internal use
 * 
 * ref - the referrer dirFile
 * ppn - the current Prompt Page Number - just a sequence from the beginning of the Big Request.
 * 
 * Prompt Page id is actually a `${lineId}-${ppn}`
 * 
 */
const rpOpen = `[[$::`, rpClose = `::$]]`;



export function appendControlQuery(url: string, ref: string, ppn: string, doNotTouchIfExists = false) {
	if (url.has(rpOpen) && url.has(rpClose)) {
		if (doNotTouchIfExists) return url;
		const o = url.getBetweenClose(rpOpen, rpClose);
		url = url.swap(`${rpOpen}${o}${rpClose}`, ``);
	}
	return url + `${rpOpen}ref=${ref.urlEnc}&ppn=${ppn.urlEnc}${rpClose}`;
}

export type ControlQueryObj = { url: string, ref: string, ppn: string };

export function extractControlQuery(url: string): ControlQueryObj {
	if (url.has(rpOpen) && url.has(rpClose)) {
		const o = url.getBetweenClose(rpOpen, rpClose);
		const cleanUrl = url.swap(`${rpOpen}${o}${rpClose}`, ``);
		return { url: cleanUrl, ...getUrlVars(o, true) } as ControlQueryObj;
	}
	return { ...emptyControlQueryObj(), url };
}

export function emptyControlQueryObj(): ControlQueryObj {
	return { url: ``, ref: ``, ppn: `` };
}