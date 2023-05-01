import { o2s, o2sB, pause, s2o } from "joto/lib/sys";
import { ajax, ajaxEndpointExists } from "broo/o/net/ajax";
import { jotClr, jotErr } from "joto/lib/jot";
import { Dict } from "joto/lib/jotypes";
import { Emu } from "../Emu";

type ArrS = string[];
export type ExistentObj = {
	err: boolean, non: ArrS,
	dirs: Dict<ArrS>,// this is an object with list of files for each directory
	risky: ArrS,
	failed: ArrS, files: ArrS
};

const ajax1 = async (url: string) => {
	return ajax(url, null, 1);
}


class MicroServer {
	readonly path = `http://localhost:${location.port || `44707`}/micro/`;
	ok = true;
	async init(currentUrl: string) {
		if (Emu.get(currentUrl).on) return true;
		try {
			const exists = await ajaxEndpointExists(this.path);
			if (!exists) {
				this.ok = false;
				this.#notRunningWarn();
				return this.ok = false;
			}
		} catch (e: any) {
			jotErr(`MicroServer.init()`, e);
			this.ok = false;
			this.#notRunningWarn();
			return false;
		}
		return true;
	}
	async compile(path: string) {
		const res = await ajax1(this.path + `?compilePath=${encodeURIComponent(path)}`);
		if (res.failed)
			throw new Error(`failed to request the compilation at ${path}`);
		const obj = s2o(res.txt);
		if (obj.err)
			throw new Error(`Compilation error:\n${obj.err}\nat "${path}"`);
		return obj;
	}
	async fingerprintAg(path: string) {

		const attempt = async () => {
			if (Emu.get(path).on) return ``;
			const res = await ajax1(this.path + `?fingerprintAg=${encodeURIComponent(path)}&___hash=${Math.random()}`);
			if (res.failed) return ``;
			return res.txt;
		}
		let left = 8;
		while (left--) {
			const res = await attempt();
			if (res) return res;
			await pause(50);
		}
		throw new Error(`failed to request the fingerprint at ${path}`);
	}
	// async list(path: string) {
	// 	// debugger;
	// 	const targetUrl = this.path + `?path=${encodeURIComponent(path)}`;
	// 	const res = await ajax1(targetUrl);
	// 	if (res.failed)
	// 		throw new Error(`failed to request the list at ${path}`);
	// 	const obj = s2o(res.txt);
	// 	if (obj.err)
	// 		throw new Error(`Listing error: ${obj.err}  at ${path}`);
	// 	jotClr(`fca`, o2sB({ act: "FOLDER", path, res, obj }));
	// 	return obj.list as string[];
	// }
	async listNonExistent(list: string[]) {
		if (!list || !list.length) throw new Error(`listNonExistent() list is empty`);
		const emu = Emu.get(list[0]);
		let obj: ExistentObj | null = null;
		if (emu.on) {
			obj = emu.listNonExistent(list);
		} else {
			const listStr = list.join(`,`);
			const targetUrl = this.path + `?listNonExistent=${encodeURIComponent(listStr)}`;
			const res = await ajax1(targetUrl);
			if (res.failed)
				throw new Error(`server error: ${res.txt} for ${listStr}`);
			obj = s2o(res.txt) as ExistentObj;
			if (obj.err)
				throw new Error(`Listing error: ${obj.err} for ${listStr}`);
		}
		jotClr(`fa8`, o2sB({ list, obj }));
		return obj;
	}
	#notRunningWarn() {
		// jotClr(`red`, `!!!!`);
		throw new Error(`MicroServer is not running.\nThe system will not be able to run the "itocol://" protocol.\n\nRun the MicroServer first (probably, by <code>npm run micro-srv</code>, but not sure), then reload the page.`);

	}
}

export const microServer = new MicroServer();