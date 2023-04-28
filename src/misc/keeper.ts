/// a smart abstraction on top of localStorage 
import localforage from "localforage";
import { jot } from "joto/lib/jot"
import { o2s } from "joto/lib/sys";


export class Keeper<ROW_TYPE> {
	#store = localforage.createInstance({ name: this.name });
	constructor(readonly name: string) {
	}
	async get(key: string) {
		return await (this.#store.getItem(key)) as ROW_TYPE;
	}
	async has(key: string) {
		return localforage.getItem(key) !== null;
	}
	async purge(key: string) {
		return await this.#store.removeItem(key);
	}
	async purgeAll() {
		return await this.#store.clear();
	}
	async set<T>(key: string, value: ROW_TYPE) {
		const had = await this.has(key);
		await this.#store.setItem(key, value);
		return had;
	}
	async keys() { return await this.#store.keys(); }
	async getMany<T>(condition: (x: ROW_TYPE) => boolean) {
		const res: ROW_TYPE[] = [];
		await this.#store.iterate((val_, key, i) => {
			const val = val_ as ROW_TYPE;
			if (condition(val)) res.push(val);
		});
		return res;
	}
	static async test() {
		const k = new Keeper<{ a: string, b: number }>(`test`), key = `x`;
		const a = await k.get(key);
		jot(`a: ${o2s(a)}`);
		await k.set(key, { a: `a`, b: 1 });
		const b = await k.get(key);
		jot(`b: ${o2s(b)}`);
	}
	static async persist() {
		if (navigator.storage) {
			const persistResult = await navigator.storage.persist();
			const isPersisted = await navigator.storage.persisted();
			jot(`Persisted storage granted`, persistResult, isPersisted);
			const quota = await navigator.storage.estimate();
			jot(`Quota: ${prettyBytes(quota.usage || 0)} / ${prettyBytes(quota.quota || 0)}`);
		}
	}
}


function prettyBytes(bytes: number, si = false, dp = 1) {
	const thresh = si ? 1000 : 1024;

	if (Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}

	const units = si
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	let u = -1;
	const r = 10 ** dp;

	do {
		bytes /= thresh;
		++u;
	} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


	return bytes.toFixed(dp) + ' ' + units[u];
}
