import { jot, jotB, jotClr, jotErr } from "joto/lib/jot";
import { nextFrame, o2sB, s2o } from "joto/lib/sys";
import { ITOCOL } from "../..";
import { defaultSysModelConf, sysPrompt } from "../../net/sysPrompt";
import { AgEngine, AgResponse } from "./AgEngine";
import { getAgDirFile, getUrlInputUser, getUrlPath } from "./AgParseLinks";


type Stride = {
	path: string;
	title: string;
	text: string;
	growth: number;
	time: number;
}
export type PromptProgressObject = {
	strides?: Stride[];
	prompt: string;
	text: string;
	done?: boolean;
	error?: { message: string, level: FailLevel };
	time: number;
}
const USE_STRIDES = false;
type OnProgressFn = (progress: PromptProgressObject) => void;
/*
this class is an interface for both AgEngine and sysPrompt
*/
export class AgGate {
	private en = new AgEngine();
	constructor() { }
	async prompt(prompt: string, onProgress: OnProgressFn) { return this.promptPage(`index~~` + prompt, onProgress); }
	async promptPage(subPath: string, onProgress: OnProgressFn) {
		if (this.waiting) return failReturn(`runtime`, `request already in progress`);
		const prompt = getUrlInputUser(subPath);
		this.wait(true);
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const This = this;
		const agentPath = ITOCOL.compilationCurrent.path;
		if (!agentPath) return failReturn(`dev`, `agent does not exist. Please make sure the agent was compiled properly`);
		subPath = subPath.cutFirst(AgEngine.PROTOCOL);
		const aiConf = defaultSysModelConf();
		this.en.input_tokens = aiConf.input_tokens;
		let failed = ``;
		const o: PromptProgressObject = { strides: [], prompt, text: ``, time: -1 };
		function failReturn(level: FailLevel = `runtime`, reason = ``) {
			onProgress({ strides: [], prompt, text: ``, error: { message: (failed = reason || failed || `unknown`), level }, time: Date.now() });
		}
		const url = subPath.startsWith(agentPath) ? subPath : `${agentPath}/${subPath}`;
		await runNextPromptPage(url);
		async function runNextPromptPage(url: string) {

			let itocolResult: AgResponse | null = null;
			try {
				itocolResult = await This.requestSmart(url);
			} catch (e: any) {
				return failReturn(`dev`, err2str(e).stripHtmlTags);
			}
			if (!itocolResult || itocolResult.error) return failReturn(`dev`, itocolResult.error);
			const prompt = itocolResult.promptPageSource;
			if (!prompt)
				return failReturn(`dev`, `no promptPageSource in itocolResult at ${url}`);
			function updateStride(path: string, text: string) {
				if (!USE_STRIDES) return;
				let stride = o.strides?.find(s => s.path === path);
				if (!stride) o.strides?.push(stride = { path, title: getAgDirFile(path), text, growth: 0, time: Date.now() });
				stride!.text = text;
				stride!.growth++;
			}
			async function onGrowth(txt: string, done: boolean) {
				if (failed) return;
				const link = This.en.aiTextToURL(txt);
				let hereitocolResult: AgResponse | null = null;
				try {
					hereitocolResult = await This.requestSmart(link);
				} catch (e: any) {
					return failReturn(`dev`, err2str(e).stripHtmlTags);
				}
				if (!hereitocolResult || hereitocolResult.error) return failReturn(`dev`, hereitocolResult?.error);
				else if (hereitocolResult.promptPageSource) {
					updateStride(url, txt);
					onProgress(o);
					if (done) {
						await runNextPromptPage(link);
					}
				} else if (hereitocolResult.output) {
					const x = hereitocolResult.output;
					o.text = /*`[from output for real] ` +*/ x.text;
					o.time = x.time;
					if (done) o.done = true;
					updateStride(url, txt);
					onProgress(o);
				}
			}
			try {
				const res = await sysPrompt({ ...aiConf, prompt }, (txt, token) => {
					onGrowth(txt, false).catch(jotErr);
				});
				This.wait(false);
				await onGrowth(res, true);
			} catch (err: any) {
				failReturn(`runtime`, err2str(err));
				jotErr(err);
				This.wait(false);
			}
			// return failReturn(`dev`, `next promptPage in journey is not implemented yet. Only a single promptPage is supported.`);
		}
	}
	private async requestSmart(url: string) {
		const quick = getUrlPath(url) == getUrlPath(this._lastUrl);
		return await this.en.request(url, quick);
	}
	private _lastUrl = ``;

	private wait(on: boolean) {
		this.waiting = on;
	}
	private waiting = false;
	async getMessages(number = Infinity) {
		const list = await this.en.agMsg.getItems(`display`);
		return number == Infinity ? list : list.slice(0, number);
	}
}


type FailLevel = `dev` | `runtime`;



function err2str(e: any): string {
	return e.message || s2o(e);
}
export async function testAgGate() {
	const gate = new AgGate();
	jot(`testAgGate()`);
	await gate.prompt(`hello`, o => {
		if (o.error) {
			const clr = o.error.level == `dev` ? `#f00` : `#f40`;
			jotClr(clr, `[${o.error.level} error] ${o.error.message}]`);
		} else
			jotB(o)
	});
}