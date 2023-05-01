import { isDebug, jot, jotClr } from "joto/lib/jot"
import { o2s, o2sB } from "joto/lib/sys";
import { crSock } from "./CrSock";


enum SysModelMode {
	chat = `chat`,
	completion = `completion`,
}

export type SysModelRow = {
	model: string;
	max: number;
	mode: SysModelMode;
};


export const sysModelsConfig: SysModelRow[] = [
	{ model: `gpt-3.5-turbo-0301`, max: 3000, mode: SysModelMode.chat },
	{ model: `text-davinci-003`, max: 4000, mode: SysModelMode.completion },
	{ model: `gpt-4-0314`, max: 8000, mode: SysModelMode.chat },
	// { model: `gpt-4`, max: 8000, mode: SysModelMode.chat },
	{ model: `gpt-4-32k`, max: 32000, mode: SysModelMode.chat },
];

export function defaultSysModelConf(): AgModelConf {
	const o = sysModelsConfig[1];
	return {
		model: o.model,
		prompt: ``,
		temperature: .9,
		input_tokens: Math.round(o.max * .7),
		tokens: Math.min(5520, Math.round(o.max * .2)),// THIS affects the response number of tokens!!!
		top_p: 1,
		fp: 0,
		pp: 0,
		// stop:  [`I:`, `You:`, `AI:`],
		stop: [`Spirit:`, `Fyodor:`],
	};
}



export type PromptModel = SysModelRow[`model`];
export type PromptConf = {
	prompt: string;
	model: PromptModel,
	tokens: number;
	temperature: number;
	top_p?: number;
	fp?: number;
	pp?: number;
	stop?: string[];
}
export type AgModelConf = PromptConf & {
	input_tokens: number;
}



export async function sysPrompt(conf: PromptConf, callback?: (allText: string, token: string) => void) {

	//jotClr(`color:#f70;`, o2sB({ ...conf, prompt: conf.prompt.slice(0, 100) + `...` }));
	const res = await crSock(
		o2s(conf)
		, (text, token) => {
			if (callback)
				callback(text.trimStart(), token);
			// jotClr(`color:#f70;`, o2sB({ text, token }));
		});
	// jotClr(`sysPrompt-DONE!\n`, res);	
	return res.trimStart();
}



export async function testSysPrompt() {
	if (!confirm(`testSysPrompt costs some money.\n\nProceed?`)) return;
	const res = await sysPrompt({
		model: `gpt-3.5-turbo-0301`,
		prompt: `Greet me in Dostoevsky style.`,
		tokens: 140,
		temperature: 1,
	});
	jot(`RESULT:\n`, res);
}
export const exportTestSysPrompt = () => {
	if (isDebug())
		(window as any).testSysPrompt = testSysPrompt;
}