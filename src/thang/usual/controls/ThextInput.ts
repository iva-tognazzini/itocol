import { CH_F } from "../../decor/propertize";
import { Thang, ThangAny } from "../../Thang";
import { Thext } from "../../Thext";

// this is similar to "Thext" but it's a text input field:
@CH_F export class ThextInput extends Thang<`change` | `enter`>{
    constructor(readonly isArea = false) {
        super(isArea ? `textarea` : `input`);
        if (!isArea)
            this.attr(`type`, `text`);
        this.el.addEventListener(`input`, () => this.emit(`change`, this.$val));
        this.el.addEventListener(`keydown`, e => {
            if (e.key == `Enter` && !e.shiftKey) {
                e.preventDefault();
                this.emit(`enter`, this.$val);
            }
        });
    }
    focus() { this.inp.focus(); return this; }
    blur() { this.inp.blur(); return this; }

    get inp() { return this.el as HTMLInputElement; }
    // all getters that start with $ are going to become contents of the corresponding function:
    get $val() { return this.inp.value; }
    set $val(t: string) { this.inp.value = t; }
    // this is an empty function to be filled. All you need to do is return this. 
    val(t: string) { return this; }
    get $placeholder() { return this.inp.placeholder; }
    set $placeholder(t: string) { this.inp.placeholder = t; }
    placeholder(t: string) { return this; }
}