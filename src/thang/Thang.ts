import { isDebug, jot, jotErr } from "joto/lib/jot"
import { CSSes, CssKeys, ListCss } from "broo/o/dom"
import { getAllProps, isEmptyObj, isFunc, isStr } from "joto/lib/sys";
import { anyNAP, Dict } from "joto/lib/jotypes";

import { CH_F, _CH_PRE } from "./decor/propertize";
import { CssThang } from "./grasp/CssThang";
import { DimThang } from "./grasp/DimThang";
import { Stage } from "./Stage";


/**
 * 
 * "Thang" is a clear and organized wrapper for a single HTML element.
 * 
 * Its purpose is to provide a simple interface for manipulating the element.
 * Raw HTML elements are hard to work with, because they have too many methods and properties that are used in a bizarre way. We want to hide all that and simplify the interface.
 * 
 */
@CH_F export class Thang<E extends string> {
    el: HTMLElement;
    ___isStage() { return false; }
    constructor(readonly tag = `div`) {
        if (!this.___isStage()) {
            if (tag == `body`) throw new Error(`You can't create a Thang("body") tag. Use Stage instead`);
            this.css.addGlobalEntriesOnce(this.ownCss());
        }
        this.el = this.___isStage() ? document.body : document.createElement(tag);
        this.#checkIf_CH_F_applied();
    }
    /**
     * This getter/setter is only for very simple html, like <b>text</b> or <img src="...">, but they should never contain any IDs and be referred in code, no events. Styles and classes are OK.
     * Why? Because I don't want to mess with rendering. In this library the main rule is to to use only DOM API directly.
     */
    get $plainHTML() { return this.el.innerHTML; }
    set $plainHTML(v: string) {
        // jot(`html`, `set`, v);
        this.el.innerHTML = v;
    }
    plainHTML(v: string) { return this; }

    stage: Stage | null = null;

    attr(name: string, val: string) { this.el.setAttribute(name, val); return this; }
    getAttr(name: string) { return this.el.getAttribute(name); }

    scrollIntoView(smooth = false) {
        this.el.scrollIntoView({ behavior: smooth ? `smooth` : `auto` });
        return this;
    }
    style(style: CSSes) { this.css.push(style); return this; }
    unStyle(...keys: CssKeys[]) { this.css.clear(...keys); return this; }
    class(...classNames: string[]) { this.css.class(...classNames); return this; }
    unClass(...classNames: string[]) { this.css.unClass(...classNames); return this; }
    private css: CssThang<typeof this> = new CssThang(this);
    dim: DimThang<typeof this> = new DimThang(this);
    /**
     * override it to return a style, used by this Thang and its babies.
     * Do not worry - no matter how many instances you create, it will be used only once
     * NOTICE: use it only for positioning and stuff, not for colorizing! If you do colorize,
     * use predefined --color vars from "shared.css", so the overall style of the app could be
     * changed later.
     */

    ownCss(): ListCss { return {}; }

    private __emitGotStage() {
        this.deepCall(false, t => {
            if (!t.stage && this.stage) {
                t.stage = this.stage;
                t.emit(`got stage`, t);
            }
        });
    }
    private __emitLostStage<X extends ThangAny>() {
        this.deepCall(false, t => {
            if (t.stage) {
                t.stage = null;
                t.emit(`lost stage`, t);
            }
        });
    }


    /// this one returns the baby, in case you need it for chaining
    babies: ThangAny[] = [];
    mom: ThangAny | null = null;
    /// this one intentionally does not return, so you don't mix it with addS or addB
    add<X extends ThangAny>(baby: X, prepend = false) {
        baby.leave();
        this.babies.push(baby);
        baby.mom = this;
        this.el[prepend ? `prepend` : `appendChild`](baby.el);
        this.emit(`got baby`, baby);
        baby.emit(`got mom`, this);
        this.__emitGotStage();
    }
    addB<X extends ThangAny>(baby: X, prepend = false) {
        this.add(baby, prepend); return baby;
    }
    /// this one returns itself, so you can chain calls
    addS<X extends ThangAny>(baby: X, prepend = false) {
        this.add(baby, prepend); return this;
    }
    /// this one removes the baby from the DOM and from the list of babies:
    remove<X extends ThangAny>(baby: X): this {
        if (baby.mom != this) throw new Error(`this is not my baby`);
        const i = this.babies.indexOf(baby);
        if (i >= 0) {
            this.babies.splice(i, 1);
            this.el.removeChild(baby.el);
            baby.mom = null;
            this.emit(`lost baby`, baby);
            baby.emit(`lost mom`, this);
        }
        this.__emitLostStage();
        return this;
    }
    removeAll() {
        while (this.babies.length > 0) {
            this.remove(this.babies[0]);
        }
    }
    leave() {
        if (this.mom) { this.mom.remove(this); }
        return this;
    }

    #events: Dict<((e: any) => void)[]> = {};
    private EV_T: E | `got baby` | `lost baby` | `got mom` | `lost mom` | `got stage` | `lost stage` | `` = ``;
    on(event: typeof this.EV_T, fn: (e: any) => void) {
        const a = this.#events[event] ??= [];
        a.push(fn);
        return this;
    }
    off(event: typeof this.EV_T, fn: (e: any) => void) {
        const a = this.#events[event];
        if (!a) return;
        const i = a.indexOf(fn);
        if (i == -1) return;
        a.splice(i, 1);
        return this;
    }
    onAsync(event: typeof this.EV_T, fn: (e: any) => Promise<void>) {
        const a = this.#events[event] ??= [];
        a.push(e => fn(e).catch(err => jotErr(err)));
        return this;
    }
    emit(event: typeof this.EV_T, e: any) {
        // console.log(`emit ${event} ${this.target.id}`, e);
        const a = this.#events[event];
        if (!a) return;
        for (const fn of a)
            fn(e);
        return this;
    }


    deepCall(includeMyself: boolean, fn: (t: ThangAny) => void) {
        if (includeMyself)
            fn(this);
        for (const b of this.babies)
            b.deepCall(true, fn);
    }
    #checkIf_CH_F_applied() {
        if (!isDebug()) return;
        const className = this.constructor.name;

        // const clProps = Object.getOwnPropertyDescriptors(this);
        const props = getAllProps(this);
        for (const propName in props)
            if (
                props.hasOwnProperty(propName)
                && propName.startsWith(_CH_PRE)
                && props[propName].get instanceof Function
            ) {
                let fail = true;
                const funcName = propName.slice(_CH_PRE.length);
                const funcCont = props[funcName].value;
                if (isFunc(funcCont)) {
                    const cont = (funcCont as () => void).toString().cutFirst(`{`).cutLast(`}`).trim();
                    if (cont.startsWith(`if (value`))
                        fail = false;
                }
                // if (className == `Thext`)
                // console.log(`found CH ${funcName} in ${className}`);
                if (fail) {
                    throw new Error(`Apparently, method "${className}.${funcName}" was not decorated. Did you use @CH_F class ${className} extends Thang..?`);
                }
            }
        // jot(`props`, props);

    }
    get $visible() { return this.el.style.visibility != `hidden`; }
    set $visible(v: boolean) {
        this.el.style.visibility = v ? `` : `hidden`;
    }
    visible(v: boolean) { return this; }
}


export class ThangAny extends Thang<any>{ }
export class Thang_ extends Thang<``>{ }


let waitId: any = 0;
export function pleaseWait(on: boolean | string, delay = 0) {
    clearTimeout(waitId);
    const act = () => {
        const a = document.getElementById(`inline-preloader`);
        if (!a) return;
        const b = document.getElementById(`inline-preloader-why`);
        const display = on ? `block` : `none`;
        if (a) a.style.display = display;
        if (b) b.style.display = display;
        if (isStr(on))
            if (b) b.innerHTML = on;
    }
    if (on && delay)
        waitId = setTimeout(act, delay);
    else act();
}

