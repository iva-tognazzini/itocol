import { confJot, jot, jotErr } from "joto/lib/jot";
import { Dict, ObjAny } from "joto/lib/jotypes";
import { Numba } from "numba";
import { Stri } from "stri";
import { launchAgBrowser } from "./agBrowser/front/AgBrowser";
import { AgGate, testAgGate } from "./agBrowser/sys/AgGate";
import { Favicon } from "./misc/Favicon";
import { Lingua } from "./misc/Lingua";
import { sicy2 } from "./misc/sicyStrong";
const { parse, generate, replace } = require('abstract-syntax-tree');


Stri.includeMe();
Stri.includeMe();
Numba.includeMe();
Lingua.includeMe();


export { Exe, DialogueItem } from "./agBrowser/sys/ExeParam";

export class ITOCOL {
	constructor(readonly agentPath: string) {
	}
	static getASTFuncs() {
		return { parse, generate, replace };
	}
	static currentLibs: ObjAny = [];
	static compilationCurrent = {
		name: ``,
		path: ``,
	};
	static get compiled() { return !!this.compilationCurrent.path; }
	static compilationDirectives = {} as Dict<{
		executables: Dict<any>;
		cdn: Dict<string>
	}>;

	async launch() {
		confJot.isDebug = true;


		if ((window as any).$ITOCOL_LE) throw new Error(`itocol already launched!`);
		(window as any).$ITOCOL_LE = true;
		// jot(`Agent x at "${this.agentPath}" is starting...`);
		await new Favicon().init();
		launchAgBrowser(this.agentPath).catch(jotErr);
	}
	async testAgGate() { return testAgGate(); }

	static #currentAgGate?: AgGate;
	static gate() {
		confJot.isDebug = !ITOCOL.compiled;
		return this.#currentAgGate = this.#currentAgGate || new AgGate();
	}
}
