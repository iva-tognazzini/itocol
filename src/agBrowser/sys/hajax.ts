import { ajax, AjaxObj } from "broo/o/net/ajax";
import { jotClr } from "joto/lib/jot";
import { isArr, o2s } from "joto/lib/sys";
import { num } from "numba";
import { Emu } from "./Emu";


const jot = (...args: any[]) => {
	// jotClr(`#faf`, ...args);
};

export async function hajax(url: string, fromLastCache: boolean, attempts = 2) {
	const emu = Emu.get(url);
	jot(`- hajax/ start: EMULATED? ${emu.on} - ${url}`);
	if (emu.on) {
		jot(`- hajax/ start: EMULATED`)
		const file = emu.getFile(url);
		const obj = {
			txt: file || ``,
			url,
			failed: !file,
			status: file ? 200 : 404,
		};
		jot(`- hajax / end: EMULATED: `, obj.txt.slice(0, 50) || `[empty file]`);
		return obj;
	}
	jot(`- hajax/ start: `, url);
	const me = hajax as any as { cache: { [url: string]: AjaxObj } };
	const cache = me.cache = me.cache || {};
	if (fromLastCache && cache[url]) {
		jot(`- hajax / end: CACHED`);
		return cache[url];
	}
	const res = await ajax(url, null, attempts);
	jot(`- hajax / AJAX`);
	return cache[url] = res;
}

export async function hajaxArray(urls: string[], fromLastCache: boolean) {
	return await Promise.all(urls.map(url => hajax(url, fromLastCache)));
}

export async function hajaxEndpointExists(url: string | string[], fromLastCache: boolean) {
	jot(`Exists/ start: `, o2s(url));
	if (isArr(url)) {
		for (const u of url) {
			jot(`trying endpoint`, u);
			if (await hajaxEndpointExists(u, fromLastCache))
				return u;
		}
		return ``;
	}
	const res = await hajax(url, fromLastCache, 0);
	jot(`Exists: /end ::: exists? ${!res.failed}: `, url);
	return res.failed ? `` : url;
}
