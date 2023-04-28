import { jot, jotClr } from "joto/lib/jot";
import { Dict } from "joto/lib/jotypes";
import { nextFrame, o2s } from "joto/lib/sys";
import { ITOCOL } from "../..";
import { AgEngine, tplExt } from "./AgEngine";
import { getBaseAgentPath } from "./AgParseLinks";
import { ExistentObj } from "./interf/AgMicroServer";



/**
 * this class emulates the entire file system for any given agent
 */
export class Emu {
	static #cache: Dict<Emu> = {};
	static get(url: string) {
		let agentPath = getBaseAgentPath(url);
		if (!agentPath.startsWith(`./`)) agentPath = `./` + agentPath;
		return this.#cache[agentPath] || (this.#cache[agentPath] = new Emu(agentPath));
	}


	private constructor(readonly agentPath: string) {
		jotClr(`#8cf`, `initiated Emu for agent "${agentPath}"`)
	}
	getFile(path: string) { return this.getResource(path, this.files); }
	async getExecutable(path: string) { return this.getResource(path, this.executables); }
	private get files() { return this.directives.cdn || {}; }
	private get executables() { return this.directives.executables || {}; }
	private getResource<T>(path: string, fileOrExecutable: Record<string, T>) {
		if (path.startsWith(`./`))
			path = path.slice(2);
		const paths = [path, `./${path}`];
		// await nextFrame(); // just to emulate async, will be removed
		const results = paths.filter((p) => fileOrExecutable[p]).map((p) => fileOrExecutable[p]);
		return results.length ? results[0] : false;
	}
	private get directives() {
		const D = ITOCOL.compilationDirectives;
		return D[this.agentPath] || D[`./` + this.agentPath] || { cdn: {}, executables: {} };
	}
	get on() {
		return ITOCOL.compilationCurrent.path.cutFirst(`./`) == this.agentPath.cutFirst(`./`);
	}
	listNonExistent(arr: string[]) {
		jotClr(`#8cc`, `listing non-existent resources: ${o2s(arr)}`);
		const checkExt = (tester: (ext: string) => boolean) => tplExt.find(tester);
		const getExt = (path: string) => `.` + path.getLast(`.`);

		const obj: ExistentObj = { err: false, non: [], files: [], dirs: {}, risky: [], failed: [] };
		arr.forEach(x => {
			let exists = false;
			let rel = x;
			x = this.fixedPath(x);
			try {
				exists = this.resourceExists(x);
			} catch (err) {
				// obj.failed.push(rel);
			}
			if (!exists)
				try {
					const found = checkExt(e => {
						// jot(`checking if ${x + e} exists :::` + this.resourceExists(x + e));
						return this.resourceExists(x + e);
					});
					exists = !!found;
					if (found) {
						const ext = getExt(found);
						rel += ext;
						x += ext;
					}
					// jot(`report: ${o2s({ exists, rel, x })}`);
				} catch (err) {
					obj.failed.push(rel);
				}

			if (!exists)
				obj.non.push(rel);
			else if (this.isFolder(x))
				obj.dirs = { ...obj.dirs, [rel]: this.listFilesInFolder(x) };
			else
				obj.files.push(rel);
		});
		return obj;
	}
	private resourceExists(path: string) {
		let yes = false;
		if (this.getFile(path))
			yes = true;
		if (this.listFilesInFolder(path).length)
			yes = true;
		jotClr(`#f22`, `checking if "${path}" exists: ${yes}`);
		return yes;
	}
	private isFolder = (path: string) => this.listFilesInFolder(path).length > 0;
	private listFilesInFolder = (path: string) => {
		path = path.endsWith(`/`) ? path : path + `/`;
		return Object.keys(this.files).filter(x => x.startsWith(path)).map(x => x.slice(path.length));
	}
	private fixedPath = (path: string) => path.startsWith(`./`) ? path.slice(2) : path

}

