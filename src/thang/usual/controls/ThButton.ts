import { CH_F } from "../../decor/propertize";
import { Thang } from "../../Thang";

type ThButtEvents = `click` | `down` | `up` | `over` | `out`;

/**
 * this is a button replacement
 */
@CH_F export class ThButton extends Thang<ThButtEvents>{
    constructor() {
        super(`button`);
        this.el.addEventListener(`click`, () => this.emit(`click`, this));
        this.el.addEventListener(`mousedown`, () => this.emit(`down`, this));
        this.el.addEventListener(`mouseup`, () => this.emit(`up`, this));
        this.el.addEventListener(`mouseover`, () => this.emit(`over`, this));
        this.el.addEventListener(`mouseout`, () => this.emit(`out`, this));
    }
    get btn() { return this.el as HTMLButtonElement; }
    get $text() { return this.el.innerText; }
    set $text(t: string) { this.el.innerText = t; }
    text(t: string) { return this; }

    set $disabled(d: boolean) {
        this.btn.disabled = d;
        this.style({ opacity: d ? `.5` : `1` });
    }
    get $disabled() { return this.btn.disabled; }
    disabled(d: boolean) { return this; }

}

