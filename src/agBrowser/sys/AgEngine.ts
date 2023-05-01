import { insertScriptIntoBrowserAsModule } from "broo/o/dom";
import { _ajaxPreventCache } from "broo/o/net/ajax";
import Handlebars from "handlebars";
import { getId } from "joto/lib/id";
import { isArr, isAsyncFunc, isFunc, isNum, isObj, isStr, nextFrame, o2s, o2sB, objectMap, pause } from "joto/lib/sys";
const { parse, generate, replace } = require('abstract-syntax-tree');

import { anyNAP, Dict, ObjAny } from "joto/lib/jotypes";

import { Keeper } from "../../misc/keeper";
import { findNpmModulePath, initJsonEditor } from "../front/createJsonEditor";
import { AgMsg, MsgFor } from "./AgMsg";
import { appendControlQuery, appendQueryVariablesToUrl, convertAiTextToURL, convertUrlToAiText, emptyControlQueryObj, extractControlQuery, getAgDirFile, getAgentName, getBaseAgentPath, getUrlInputAI, getUrlInputUser, getUrlPath, getUrlVars, objLinkToAiText } from "./AgParseLinks";
import { agTpl } from "./AgTpl";
import { Emu } from "./Emu";
import { Exe } from "./ExeParam";
import { hajax, hajaxEndpointExists } from "./hajax";
import { microServer } from "./interf/AgMicroServer";
import { tokensCutter } from "./TokensCutter";
import { jot } from "joto/lib/jot";
import { ITOCOL } from "../..";
export const assets3rdPartyJsPath = `./assets/3rd_party_js/`;

export type AgResponse = {
	id: string;
	error?: string,// empty if no error
	promptPageSource?: string,
	output?: {
		text: string,
		time: number;
	}
}

export type VariantsAiObj = {
	aiVariants: Dict<string>,
}

type SysState = VariantsAiObj & {
	lineId: string,
	userInput: string,
}
type SysStateKey = keyof SysState;

export const tplExt = [`.hbs`, `.md`];

export class AgEngine {
	constructor() {
	}
	runTsInBrowser(path: string) {

	}
	static readonly PROJ_EXT = `.ag`;
	static readonly PROTOCOL_ABBR = `itocol`;
	static readonly PROTOCOL = `itocol://`;
	static readonly ERR_TKN = `¾ERROR¾`;
	static readonly OUTPUT_TKN = `¾OUT¾`;

	currentTsPath = ``;
	currentHbsPath = ``;
	currentGeneralPath = ``;
	currentFullUrl = ``;
	currentTsCont = ``;
	currentError = ``;


	input_tokens = Infinity;
	async request(url: string, quick: boolean) {
		const r: AgResponse = {
			id: ``,
		}
		this.currentError = ``;

		// jot(`AgEngine._request(${url})`);
		if (!url.includes(AgEngine.PROJ_EXT))
			throw new Error(`Only <code>${AgEngine.PROJ_EXT}</code> projects are supported. Your project folder must end with <code>${AgEngine.PROJ_EXT}</code> extension.`);
		url = url.cutFirst(AgEngine.PROTOCOL);
		if (!ITOCOL.compiled)
			jot(`AgEngine._request(url changed to: ${url})`);

		if (!url.startsWith(`./`))
			throw new Error(`Your url must start with ${AgEngine.PROTOCOL}./`);
		if (quick) this.checkQuick(url);// when "quick", make sure we reload the same path
		// jot(`quick?`, quick, `url:`, url);
		url = (this.ctrlQuery = extractControlQuery(url)).url;
		// jotB(this.ctrlQuery);
		await this.agMsg.refresh(url);
		await this.getSysState(url);
		const emuOn = Emu.get(url).on;
		if (!emuOn) _ajaxPreventCache.on = true;

		try {
			r.promptPageSource = await this.rawRequest(url, quick);
		} catch (e: any) {
			this.currentError = r.error = e.message || e;
			if (emuOn)
				setTimeout(() => {
					throw e;
				}, 500);
			else throw e;
		}
		r.id = this.sysState.lineId;
		const pfx = AgEngine.OUTPUT_TKN;
		if (r.promptPageSource?.startsWith(pfx)) {
			r.output = r.output || {} as any;
			r.output!.text = r.promptPageSource.slice(pfx.length);
			r.output!.time = Date.now();
			r.promptPageSource = ``;
		}
		return r;
	}

	aiTextToURL(newText: string) {
		if (!newText) return ``;
		const url = this.currentFullUrl;
		const basePath = getBaseAgentPath(url).cutFirst(AgEngine.PROTOCOL);
		const link = convertAiTextToURL(basePath, newText, ``);
		const key = this.getKeyPath(url);
		return appendControlQuery(link, key, (this.ctrlQuery.ppn.toNum(0) + 1).toString());
	}

	private async restartBigRequestIfNeeded(url: string) {
		const input = getUrlInputUser(url);
		const isRetry = getUrlVars(url, false, true)[AgEngine.revisitKey] == `Y`;
		const needRefresh = input && !isRetry;
		if (needRefresh) {
			const ss = this.sysState;
			ss.lineId = getId();
			ss.userInput = input;
		}
		return needRefresh;
	}
	static revisitKey = `DEV_REVISIT`;
	setUrlVisited(url: string) {
		return appendQueryVariablesToUrl(url, { [AgEngine.revisitKey]: `Y` }).swap(`.ag?`, `.ag/?`);
	}
	private getKeyPath(url: string) { return getAgDirFile(url) || `index`; }
	private async storeAiVariantIfNeeded(url: string, aiVariant: string) {
		const firstInBigRequest = await this.restartBigRequestIfNeeded(url);
		if (firstInBigRequest)
			this.sysState.aiVariants = {};
		else {
			const promptUrlKey = this.ctrlQuery.ref;
			this.sysState.aiVariants[promptUrlKey] = aiVariant;
		}
		await this.saveSysState(url);
		return firstInBigRequest;
	}
	ctrlQuery = emptyControlQueryObj();
	private checkQuick(url: string) {
		const lastPath = getUrlPath(this.currentFullUrl);
		const newPath = getUrlPath(url);
		if (lastPath != newPath)
			throw new Error(`Quick requests must be to the same path. You are trying to go from <code>${lastPath}</code> to <code>${newPath}</code>.`);
		if (this.currentError)
			throw new Error(`Quick requests are not allowed after an error. Your previous request failed:\n\n` + this.currentError);
	}
	private async rawRequest(url: string, quick: boolean) {
		await this.#initEngine(url);
		this.currentFullUrl = url;
		await this.storeAiVariantIfNeeded(url, convertUrlToAiText(url, ``));
		// now, we need to load the file from the url:
		const candidates = [
			getUrlPath(url),
			getUrlPath(url) + `/index`
		];
		const foundUrlTs = quick ? this.currentTsPath : await hajaxEndpointExists([
			...candidates.map(c => `${c}.ts`),
		], quick);
		const foundUrlHbs = quick ? this.currentHbsPath : await hajaxEndpointExists(
			// [
			//     ...candidates.map(c => `${c}.hbs`),
			//     ...candidates.map(c => `${c}.md`),
			// ]
			tplExt.reduce((a, ext) => [...a, ...candidates.map(c => `${c}${ext}`)], [] as string[])
			, quick
		);
		const foundUrlGeneral = (foundUrlTs || foundUrlHbs).cutLast(`.`);
		if (!foundUrlGeneral) {
			const root = getBaseAgentPath(url);
			let dirFile = getAgDirFile(url) || `index`;
			const isDir = dirFile.endsWith(`/`);
			if (isDir) dirFile += `index`;
			throw new Error(`Not found: <code>${url}</code>.
            Are you sure you created ${[`.ts`, ...tplExt].map(a => `<code>${dirFile}${a}</code>`).join(` or `)} file?
            ${url.includes(`?`) ? `` : `Hint: did you forget to put <code>?</code> in your url?`}
            ${o2sB({ root, dirFile })}
            `);
		}
		this.currentGeneralPath = foundUrlGeneral;
		this.currentState = await this.getState(url, quick);
		let output = ``;
		const keyPath = this.getKeyPath(url);
		const param: Exe<Dict<any>, Dict<any>> = {
			id: getId() + `_pp`,
			state: this.currentState!,
			// redirect: (newPath: string) => {
			// jot(`Redirecting to: ${newPath}`);
			// },
			finish: (text: string) => {
				output = text;// this will trigger other behavior, see below "if(output)"
				// jot(`Output: ${text}`);
			},
			dialogue: await this.agMsg.getItems(`prompt`, keyPath),
			query: {
				vars: getUrlVars(url),
				path: getUrlPath(foundUrlTs || foundUrlHbs),
				input: {
					user: this.sysState.userInput,
					id: this.sysState.lineId,
					ai: getUrlInputAI(url),
				},
			},
			system: {
				parse, generate, replace
			},
			libs: ITOCOL.currentLibs,
		};
		if (foundUrlTs) {
			const cont = this.currentTsCont = quick ? this.currentTsCont : (await hajax(foundUrlTs, quick)).txt;
            /*const res =*/ await this.executeTS(foundUrlTs, [param], quick);
			this.currentTsPath = foundUrlTs;
			await this.saveState(foundUrlTs, this.currentState);


			if (output) {
				const aiMessage = objLinkToAiText(param.query);
				const finishFor = async (For: MsgFor) => {
					const forPrompt = For == `prompt`;
					const msg = { ...param.query.input, ai: forPrompt ? aiMessage : output };
					// param.query.input.ai = output;
					await this.agMsg.idempotentUpdate(For, {
						...msg,
						aiVariants: this.sysState.aiVariants,
						...this.ctrlQuery,
					});
				}
				await Promise.all([
					finishFor(`prompt`),
					finishFor(`display`),
				]);
				return `${AgEngine.OUTPUT_TKN}${output}`;
			}
		}
		if (foundUrlHbs) {


			/**
			 * ok, I decided to get rid of the $signs and put all to the root
			 * of glob, both state and vars! But to prevent collisions, I will
			 * explicitly throw an error if there is a collision.
			 */
			if (!isObj(param.state) || !isObj(param.query.vars))
				throw new Error(`The state and query vars must be objects`);
			objectMap(param.state as any, (v, k) => {
				if (param.query.vars[k!]) throw new Error(`The state and query vars must not have the same keys. The key <code>${k}</code> is present in both. Please rename one of them.`);
			});
			const forbiddenNames = [`agName`, `endpoint`, `dialogue`, `input`, `str`, `obj`, `sys`, `input_tokens`];
			forbiddenNames.forEach(n => {
				if (param.query.vars[n] || param.state[n]) throw new Error(`The following variable names are reserved: ${forbiddenNames.map(_ => `<code>${_}</code>`).join(`, `)}.\nYou have a variable, named <code>${n}</code> either in query vars or in your state. Please rename it.`);
			});



			const glob: ObjAny = {
				...param.query.vars,
				...param.state,
				dialogue: param.dialogue,
				input: param.query.input,
				agName: getAgentName(foundUrlHbs),
				endpoint: (foundUrlHbs.cutLast(`.`)),
				EQ: `==`,
			};
			this.currentHbsPath = foundUrlHbs;
			try {
				const r = await agTpl.run(getBaseAgentPath(foundUrlHbs), foundUrlHbs, glob, ``, [], quick);
				const out = isStr(r) ? r : r._text;
				if (!out) throw new Error(`Possible reasons:\n - The file is empty. Please add some text to this file and save it.`
					+ `\n - The file has a template handlebars error. Please check the syntax.`);
				_ajaxPreventCache.on = false;
				const outCut = this.currentTokensCutResult = tokensCutter(out, this.input_tokens);
				return outCut.prompt;
			} catch (e: any) {
				if (e.message) {
					e.message = `Template at <code>${foundUrlHbs}</code> failed.<br><br>${e.message}`;
				}
				throw e;
			}
		} else {
			_ajaxPreventCache.on = false;
			throw new Error(`You have a <code>${foundUrlTs}</code>, but it has no .hbs counterpart. 
            
            1. If you want to use .ts only and finish the "big request" with sending AI's response to the user, you must call <code>p.finish("Text for end user")</code> function.
            2. If you want to create a prompt-page at this URL (${foundUrlGeneral}) - create a <code>${foundUrlTs.cutLast(`.`)}.hbs</code> file (next to <code>${foundUrlTs.getLast(`/`)}</code> you already have).`);
		}
	}
	currentTokensCutResult = {} as ReturnType<typeof tokensCutter>;
	async calcLastTsFingerprint(overridePath: string) {
		overridePath = overridePath.cutFirst(AgEngine.PROTOCOL);
		const f = await microServer.fingerprintAg(
			getBaseAgentPath(overridePath //|| this.currentTsPath || this.currentHbsPath
			) + `/`);
		return f;
	}


	currentState: Dict<any> | null = null;
	async getState(url: string, quick: boolean) {
		const fromStorage = await this.stateKeeper.get(getBaseAgentPath(url));
		const emptyOne = await this.#getInitialEmptyStateFromTsFile(url, quick);
		return this.currentState = this.currentState || fromStorage || emptyOne;
	}
	async saveState(url?: string, state?: any) {
		url = url || this.currentGeneralPath;
		await this.stateKeeper.set(getBaseAgentPath(url), state);
	}
	async purgeState(url?: string) {
		url = url || this.currentGeneralPath;
		await this.stateKeeper.purge(getBaseAgentPath(url));
	}
	async #getInitialEmptyStateFromTsFile(url: string, quick: boolean) {
		const base = getBaseAgentPath(url);
		const path = base + `/emptyState.ts`;
		if (!quick && !await hajaxEndpointExists(path, quick))
			throw new Error(`Your project at <code>${base}</code> must have a <code>${path}</code> file.`);
		return await this.executeTS(path, undefined, quick);
	}
	private stateKeeper = new Keeper<anyNAP>(`agStates`);

	private sysStateKeeper = new Keeper<SysState>(`agSysStates`);
	sysState = null as unknown as SysState;
	async getSysState(url: string) {
		return this.sysState =
			this.sysState
			|| await this.sysStateKeeper.get(getBaseAgentPath(url))
			|| this.emptySysState();
	}
	private emptySysState(): SysState {
		return { lineId: ``, userInput: ``, aiVariants: {}, };
	}

	agMsg = new AgMsg(this);




	async saveSysState(url?: string, state?: SysState) {
		url = url || this.currentTsPath;
		if (state) this.sysState = state;
		if (!this.sysState)
			this.sysState = this.emptySysState();
		await this.sysStateKeeper.set(getBaseAgentPath(url), this.sysState!);
	}
	req(path: string) {
		return require(path);
	}

	private recentModules: Dict<{ default: any }> = {};
	async executeTS(path: string, args: any[] | undefined, quick: boolean) {
		const emu = Emu.get(path);
		let indexModule: { default: any } | null = null;
		if (emu.on) {
			indexModule = await emu.getExecutable(path);
			// debugger;
		} else {
			const loadModule = await this.getTsInterpreter();
			if (!loadModule) {
				throw new Error(`failed to load TS module at <code>${path}</code>. Did you forget to call #initTsInBrowser()?`);
			}
			try {
				indexModule = this.recentModules[path] = quick ? this.recentModules[path] : await loadModule(path);
			} catch (e: any) {
				const out: string[] = [];
				if (isArr<Error>(e)) {
					e = e[0];
					// e.forEach((e: Error) => {
					// out.push(`${e.stack?.split(`\n`).map(s => `==> ${s}`).join(`\n`)}`);
					// });
					// throw new Error(out.join(`\n=========\n`));
				}
				if (!e.message) throw new Error(e);
				e.message = `Unable to load TS module at <code>${path}</code>.

            <b>WARNING:</b> If you tried to import some NPM module or any other non-local relative ts file - please do not do that. It is not supported yet, but will be in the future!

            Feel free, however, to import relative files from the same agent folder, like 
            <code>import {something} from "./someFile.ts"</code>

            Or maybe this error is not related to imports, see for yourself:\n${e.message}`;
				throw e;
			}
		}
		if (!indexModule?.default) {
			const msg = `You need to export default object${path.has(`emptyState`) ? `` : ` or function`} using the <code>export default</code> statement. To resolve this issue, you can either add the export statement to the .ts file or remove the file entirely and use the <code>${path.cutLast(`.`)}.hbs</code> file only, which is more suitable for simpler prompt endpoints (those that do not modify state or need no complex logic).`
			throw new Error(msg);
		}
		try {
			const f = indexModule.default;
			const params = args || [];
			if (isAsyncFunc(f))
				return await f(...params);
			else
				return f(...params);
		} catch (e: any) {
			if (e.message) e.message = /*html*/`<fieldset style="border:2px solid #a00;border-radius:1em;background-color:#0004;">
                <legend>Failed to execute <code>${path}</code></legend>${e.message}\n\n</fieldset>
            You might need to look at the Developer Tools => console for more details.`;
			throw e;
		}
	}
	#isInit = false;
	async getTsInterpreter() {
		const getMod = () => (window as any).$TS_LOAD_MODULE;
		if (getMod()) return getMod();
		const foundPath = await findNpmModulePath(`ts-browser-klesun/src/ts-browser.js`, `TS Interpreter`);

		insertScriptIntoBrowserAsModule(`
            import { loadModule } from '${foundPath}';
            window.$TS_LOAD_MODULE = loadModule;    
        `);
		while (true) {
			if (getMod()) break;
			await nextFrame();
		}
		return getMod();
	}
	async #initEngine(currentUrl: string) {
		if (this.#isInit) return;
		this.#isInit = true;
		await microServer.init(currentUrl);
		Handlebars.registerHelper(`capital`, s => s.capit);

		Handlebars.registerHelper('is', function (this: any, v1, v2, options) {
			return v1 === v2 ? options.fn(this) : options.inverse(this);
		});
		Handlebars.registerHelper('when', function (this: any, v1, op, v2, options) {
			if (!options) throw new Error(`{{#when}} helper requires 3 arguments value, operator, value, but got {{#when ${o2s(v1)} ${o2s(op)} ${o2s(v2)}}}`);
			switch (op) {
				case '==': return v1 == v2 ? options.fn(this) : options.inverse(this);
				case '===': return v1 === v2 ? options.fn(this) : options.inverse(this);
				case '!=': return v1 != v2 ? options.fn(this) : options.inverse(this);
				case '!==': return v1 !== v2 ? options.fn(this) : options.inverse(this);
				case '<': return v1 < v2 ? options.fn(this) : options.inverse(this);
				case '<=': return v1 <= v2 ? options.fn(this) : options.inverse(this);
				case '>': return v1 > v2 ? options.fn(this) : options.inverse(this);
				case '>=': return v1 >= v2 ? options.fn(this) : options.inverse(this);
				case '&&': return v1 && v2 ? options.fn(this) : options.inverse(this);
				case '||': return v1 || v2 ? options.fn(this) : options.inverse(this);
				default: throw new Error(`Unknown operator: ${op}, used as {{#when ${o2s(v1)} ${o2s(op)} ${o2s(v2)}}}`);
			}
		});

		Handlebars.registerHelper(`obj`, s => o2sB(s));
		Handlebars.registerHelper(`str`, (s: any) => {
			if (!s) return s;
			if (isStr(s._text)) return s._text;
			if (isObj(s)) return o2s(s);
			if (isFunc(s?.toString)) return s.toString();
			return s;
		});
		Handlebars.registerHelper(`either`, (a: any, b: any) => a || b);
		Handlebars.registerHelper(`md_chapters`, (depthShift: any, text: any) => {
			if (!isNum(depthShift)) throw new Error(`md_chapters: depthShift must be a number, but it is ${typeof depthShift}`);
			if (!isStr(text)) throw new Error(`md_chapters: text must be a string, but it is ${typeof text}`);
			if (depthShift < 1) throw new Error(`md_chapters: depthShift must be >= 1`);
			return (`\n` + text).swap(`\n#`, `\n#` + `#`.repeat(depthShift)).slice(1);
		});
		this.initExampleHelper();
		await initJsonEditor();
		await pause(200);
	}
	private initExampleHelper() {
		new AgExample();
	}
}



export class AgExample {
	constructor() {
		Handlebars.registerHelper(`example`, function (this: any, ...args: any[]) {
			const options = args.pop();
			const isFixed = args[args.length - 1] === `fixed`;
			const open = !isFixed ? AgExample.open : `EXAMPLE`;
			const close = !isFixed ? AgExample.close : ``;
			return new Handlebars.SafeString(`${open}${procFixed(options.fn(this))}${close}`);
			function procFixed(s: string) {
				if (!isFixed) return s;
				return s.split(`\n`).map(l => {
					if (l.trim().startsWith(`^`)) return l.trim().slice(1);
					return l;
				}).join(`\n`);
			}
		});

	}
	static open = `[EXAMPLE¾]`;
	static close = `[¾EXAMPLE]`;
}