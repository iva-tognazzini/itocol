import { eng1000 } from "./Eng1000";
import { mulberry01, mulberry32 } from "joto/lib/rand";



const pronouns = [`I`, `you`, `he`, `she`, `it`, `we`, `they`,
	`You`, `He`, `She`, `It`, `We`, `They`,] as const;
type Pronoun = typeof pronouns[number];

const possessive = [`my`, `your`, `his`, `her`, `its`, `our`, `their`,
	`My`, `Your`, `His`, `Her`, `its`, `our`, `their`,] as const;

type Possessive = typeof possessive[number];

const vowels = [`a`, `e`, `i`, `o`, `u`,] as const;
type Vowel = typeof vowels[number];

const articles = [`a`, `an`, `the`,] as const;
type Article = typeof articles[number];

type Prefix = Possessive | Article;



export const PI = Math.PI;
class LinguaFactory {
	@N safe(fn: () => string) { return !this.val ? `` : fn(); }
	@N private get val(): string { return this as unknown as string; }
	@N get lower() { return this.val.toLowerCase(); }
	@N get upper() { return this.val.toUpperCase(); }
	@N get isUpperCase() { return this.val == this.val.upper; }
	@N get isLowerCase() { return !this.val.isUpperCase }
	@N get capit() { return this.safe(() => this.val[0].upper + this.val.slice(1)); }
	@N get capitEach() { return this.safe(() => this.val.split(` `).map(a => a.capit).join(` `)); }
	@N get isCapit() { return !this.val ? `` : this.val[0].isUpperCase; }
	@N get isSpace() { return this.val == ` ` || this.val == `\t`; }
	@N get startsWithVowel() {
		return !this.val ? false : vowels.includes(this.val[0].lower as Vowel);
	}
	@N get num() { return Number(this.val); }
	@N prefixed(pfx: Prefix) {
		const val = this.val;
		const isArticle = articles.includes(pfx as Article);
		const isPossessive = possessive.includes(pfx as Possessive);
		const isDefinite = isArticle && pfx == `the`;
		const isName = val.isCapit;
		if (isName)
			return val;
		if (isDefinite || isPossessive)
			return `${pfx} ${val}`;
		return `${val.startsWithVowel ? `an` : `a`} ${val}`;
	}
	@N braced(pre = ``, post = ``) {
		return this.val ? `${pre}(${this.val})${post}` : ``;
	}
	@N bake(pre = ``, post = ``) {
		return this.val ? `${pre}${this.val}${post}` : ``;
	}
	@N trimmed(start = ` `, end = ``) {
		let s = this.val;
		if (!s) return s;
		end = end || start;
		while (s.startsWith(start)) s = s.slice(start.length);
		while (s.endsWith(end)) s = s.slice(0, -end.length);
		return s;
	}
	@N get trimGPT() {
		return this.val.swap(`\r\n`, `\n`).swap(`  `, ` `)
			.split(`\n`).map(s => s.trimStart()).join(`\n`).trim();
	}
	@N get trimLines() {
		return this.val.split(`\n`).map(s => s.trim()).join(`\n`);
	}
	@N getAllBetween(a: string, b: string) {
		return this.val.split(a).slice(1).map(s => s.split(b)[0]);
	}
	@N swapEach(from: string, to: () => string) {
		return this.val.split(from).map((a, i) => (i ? to() : ``) + `${a}`).join(``);
	}
	@N swapEachI(from: string, to: (i: number) => string) {
		return this.val.split(from).map((a, i) => (i ? to(i) : ``) + `${a}`).join(``);
	}

	@N get newLinesForMD() {
		return this.val.split(`\n`).map(x => x.trim() + `  `).join(`\n`);
	}
	@N get unDot() {
		return this.val.trimmed(`.`);
	}

	@N toNum(ifNan: number) {
		const n = Number(this.val);
		return isNaN(n) ? ifNan : n;
	}

	@N swapStart(from: string, to: string) {
		const v = this.val;
		return v.startsWith(from) ? to + v.slice(from.length) : v;
	}
	@N swapHard(from: string, to: string) {
		let v = this.val;
		while (v.includes(from)) v = v.swap(from, to);
		return v;
	}
	@N get aiize() {
		return this.val.swap(`AI`, `<span class=ai>AI</span>`)
	}

	@N get varName() {
		return this.val.split(` `).map(s => s.capit).join(``);
	}

	@N get htmlEnc() {
		return this.val.swap(`&`, `&amp;`).swap(`<`, `&lt;`).swap(`>`, `&gt;`).swap(`"`, `&quot;`);
	}
	@N get htmlDec() {
		const textArea = document.createElement('textarea');
		textArea.innerHTML = this.val;
		return textArea.value;
	}

	@N get urlEnc() {
		const a = encodeURIComponent(this.val);//.swap(` `, `%20`);
		return a;
	}
	@N get urlEncSimple() {
		// encode only those characters that messes url. 
		const ch = [`+`, `&`, `=`, `?`, `#`, `%`, `\t`, `\n`, `\r`];
		const a = this.val.split(``).map(c => ch.includes(c) ? encodeURIComponent(c) : c).join(``).swap(` `, `+`);
		return a;
	}
	@N get urlDecSimple() {
		let v = this.val;
		const ch = [`+`, `&`, `&`, `=`, `?`, `#`, `%`, `\t`, `\n`, `\r`, ` `];
		// if (v.has(`increased`)) debugger;
		ch.forEach(x => v = v.swap(x.urlEnc, x).swap(x.urlEnc.lower, x))
		return v;
	}
	@N get urlDec() {
		const v = this.val;
		try {
			return decodeURIComponent(v).swap(`+`, ` `);
		} catch (e: any) {
			// debugger;
			if (e.message == 'URI malformed') return this.val;
			else throw e;
		}
	}

	@N get resolvePaths() {
		if (!this.val) return ``;
		const parts = this.val.split(`/`);
		while (true) {
			const i = parts.indexOf(`..`);
			if (i < 0) break;
			parts.splice(i - 1, i == 0 ? 1 : 2);
		}
		while (true) {
			const i = parts.indexOf(`.`);
			if (i < 0) break;
			parts.splice(i, 1);
		}
		const path = parts.join(`/`);
		// if (!path) throw new Error(`path "${this.val}" resolved to an empty string`);
		return path;
	}

	@N indexOfRegEx(query: RegExp, fromPosition: number): number {
		const str = this.val;
		const regex = new RegExp(query.source, "g" + (query.ignoreCase ? "i" : ""));
		regex.lastIndex = fromPosition; // set the starting position for the search
		const match: RegExpExecArray | null = regex.exec(str);
		return match !== null ? match.index : -1;
	}
	@N get stripHtmlTags() { return this.val.replace(/<[^>\s]*(?<![\s]+)>/gi, ''); }
}

export const alphabet = `abcdefghijklmnopqrstuvwxyz`.upper.split(``);

// const randGen = mulberry32(Date.now() % 100000);
const longestWord = eng1000.reduce((a, b) => a.length > b.length ? a : b);
export function dummyWord(seed = -1) {
	if (seed < 0) throw new Error(`seed must be a positive number`);
	if (length > longestWord.length) throw new Error(`length must be less than ${longestWord.length} characters (as in ${longestWord})`);
	const rand = mulberry32(seed);
	return eng1000[rand() % eng1000.length];
}
export function dummyPhrase(seed = -1, length = 20) {
	const max = 2 ** 32;
	seed = seed % max;
	if (seed < 0) throw new Error(`seed must be a positive number`);
	if (length > 100) throw new Error(`length must be less than 100 words`);
	let res = ``;
	const rand = mulberry01(seed + 3455);
	for (let i = 0; i < length; i++) {
		res += (dummyWord(seed + i));
		if (rand() < 0.23) res += `, `;
		else if (rand() < 0.16) res += `. `;
		else res += ` `;
	}
	return res.split(`. `).map(s => s.capit).join(`. `).trim().trimmed(`.`).trimmed(`,`) + (rand() < .3 ? `.` : rand() < .1 ? `...` : `!`);
}

/**
 * this function is a decorator factory that makes getter native to Array
 * @param target 
 * @param propName 
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function P(target: object, propName: string) {
	const hiddenName = `¡ª${propName}`;
	Object.defineProperty(String.prototype, propName, {
		set<T>(v: T) { return this[hiddenName] = v; },
		get() { return this[hiddenName]; }
	});

}
///////////////////////////////////////////////
/**
 * this function is a decorator factory that makes the function or the property native to Array
 * @param target 
 * @param fnName 
 * @param fnCont 
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function N(target: object, fnName: string, fnCont: PropertyDescriptor) {
	if (fnCont.value) {
		Object.defineProperty(String.prototype, fnName, {
			value<T>(...args: T[]) {
				return fnCont.value.apply(this, [...args]);
			}
		});
	} else if (fnCont.get) {
		Object.defineProperty(String.prototype, fnName, {
			get<T>() {
				// console.log(`applying getter ${fnName} to ${this}`);
				return fnCont.get!.apply(this);
			}
		});
	}

}


export class Lingua {
	static includeMe() { return `thanks!`; }
}
declare global {
	interface String extends LinguaFactory {
	}
}

