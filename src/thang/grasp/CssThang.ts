import { CSSes, CssKeys } from "broo/o/dom"
import { camelToDashCase, dashToCamelCase } from "../../misc/str";
import { isEmptyObj, obj2arrMap, objectMap } from "joto/lib/sys";
import { ThangAny } from "../Thang";
import { GraspThang } from "./GraspThang"
import { Dict } from "joto/lib/jotypes";

export class CssThang<T extends ThangAny> extends GraspThang<T> {

    push(style: CSSes) {
        this.clear(...Object.keys(style) as CssKeys[]);
        Object.keys(style).forEach((k_) => {
            const k = dashToCamelCase(k_) as any;
            return this.el.style[k] = (style[k]!).cutLast(`;`);
        });
        return this;
    }
    clear(...keys: CssKeys[]) {
        const s = this.el.style;
        for (const k of keys) {
            s.removeProperty(k + ``);
            s.removeProperty(camelToDashCase(k + ``));
        }
        return this;
    }
    class(...classNames: string[]) {
        classNames.forEach(c => this.el.classList.add(c.cutFirst(`.`)));
        return this;
    }
    unClass(...classNames: string[]) {
        classNames.forEach(c => this.el.classList.remove(c.cutFirst(`.`)));
        return this;
    }
    private static addedEntries: Dict<boolean> = {};
    addGlobalEntriesOnce(entries: Dict<CSSes>) {
        if (isEmptyObj(entries)) return;
        objectMap(entries, (v, k) => {
            const src = this.cssToText(k!, v);
            if (CssThang.addedEntries[src]) return;
            CssThang.addedEntries[src] = true;
            const style = document.createElement(`style`);
            style.innerHTML = src;
            document.head.appendChild(style);
        });
    }
    private cssToText(selector: string, style: CSSes) {
        const props = obj2arrMap(style, (v, k) => {
            return `${camelToDashCase(k!.trim())}:${(v + ``).cutLast(`;`).trim()}`;
        });
        return `${selector}{\n\t${props.join(`;\n\t`)}\n}`;
    }
    // let's not do this. Let's not use direct text insertion.
    // not in HTML, not in CSS. Let's use the DOM API.
    // static addStyle(cssText: string) {
    //     cssText = cssText.trim();
    //     if (!cssText) return;
    //     cssText = cssText.cutFirst(`<style>`).cutLast(`</style>`);
    //     const style = document.createElement(`style`);
    //     style.innerHTML = cssText;
    //     document.head.appendChild(style);
    // }

}



