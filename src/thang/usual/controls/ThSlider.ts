import { jot } from "joto/lib/jot";
import { CH_F } from "../../decor/propertize";
import { Thang } from "../../Thang";
import { Thext } from "../../Thext";
import { Thlex } from "../Thlex";

type ThButtEvents = `click` | `down` | `up` | `over` | `out` | `change`;


type SliderConf = {
    min?: number;
    max?: number;
    step?: number;
    val?: number;
}

/**
 * this is a button replacement
 */
@CH_F export class ThSlider extends Thang<ThButtEvents>{
    constructor(readonly conf: SliderConf = {}) {
        super(`input`);
        this.attr(`type`, `range`);
        const attrN = (name: string, val: number) => this.attr(name, val + ``);
        attrN(`min`, conf.min || 0);
        attrN(`max`, conf.max || 100);
        attrN(`step`, conf.step || 1);
        attrN(`value`, conf.val || 0);
        this.el.addEventListener(`click`, () => this.emit(`click`, this));
        this.el.addEventListener(`mousedown`, () => this.emit(`down`, this));
        this.el.addEventListener(`mouseup`, () => this.emit(`up`, this));
        this.el.addEventListener(`mouseover`, () => this.emit(`over`, this));
        this.el.addEventListener(`mouseout`, () => this.emit(`out`, this));
        this.el.addEventListener(`input`, () => this.emit(`change`, this));
        this.style({
            padding: `0`,
            border: `none`,
        });
    }
    get sl() { return this.el as HTMLInputElement; }
    get $val() { return this.sl.value; }
    set $val(t: string) { this.sl.value = t; }
    val(t: string) { return this; }

    get $max() { return this.sl.max; }
    set $max(t: string) { this.sl.max = t; }
    max(t: string) { return this; }

    set $disabled(d: boolean) {
        this.sl.disabled = d;
        this.style({ opacity: d ? `.5` : `1` });
    }
    get $disabled() { return this.sl.disabled; }
    disabled(d: boolean) { return this; }

}

@CH_F export class ThSliderNum extends Thlex<`change`>{
    constructor(readonly conf: SliderConf = {}) {
        super({ dir: `h`, gap: `.3em`, align: `center`, justify: `center`, width: `100%` });
        this.sl.style({ flexGrow: `1`, width: `100%`, minWidth: `2em` });
        this.addS(this.sl);
        this.addS(this.num);
        const maxLen = Math.round(this.step2text(this.sl.getAttr(`max`) || ``, this.step).length * (3 / 4) * 10) / 10;
        // jot(maxLen);
        this.num.style({
            // fontFamily: `monospace`,
            width: `${maxLen}em`,
            fontSize: `.8rem`,
        });
        this.updateValue();
        this.sl.on(`change`, () => this.updateValue());
    }
    sl = new ThSlider(this.conf);
    num = new Thext().text(`?`);
    get $val() { return this.sl.$val; }
    set $val(t: string) { this.sl.$val = t; this.updateValue(); }
    val(t: string) { return this; }
    private step2text(val: string, step: number) {
        const ext = Math.ceil(Math.max(0, Math.log10(1 / step)));
        return parseFloat(val).toFixed(ext);
    }
    get step() { return this.conf.step || 1; }
    updateValue() {
        const next = this.step2text(this.sl.$val, this.step);
        if (this.num.$text === next) return;
        this.num.text(next);
        this.emit(`change`, this.sl);
    }
}