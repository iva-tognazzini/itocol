import { jot } from "joto/lib/jot";
import { CH_F } from "../../decor/propertize";
import { Thang } from "../../Thang";
import { Thext } from "../../Thext";
import { Thlex } from "../Thlex";



type ThSelectEvents = 'click' | 'change' | 'over' | 'out';

type Option = {
    value: string;
    label: string;
};

export type SelectConf = {
    options: Option[];
    selected?: string;
};

/**
 * this is a select replacement
 */
@CH_F
export class ThSelect extends Thang<ThSelectEvents> {
    constructor(readonly conf: SelectConf = { options: [] }) {
        super('select');

        this.initOptions(conf.options);
        if (conf.selected) {
            this.$val = conf.selected;
        }

        this.el.addEventListener('click', () => this.emit('click', this));
        this.el.addEventListener('change', () => this.emit('change', this));
        this.el.addEventListener('mouseover', () => this.emit('over', this));
        this.el.addEventListener('mouseout', () => this.emit('out', this));

        this.style({
            padding: '.2em',
            // border: 'none',
        });
    }

    get selectEl() {
        return this.el as HTMLSelectElement;
    }

    get $val() { return this.selectEl.value; }

    set $val(value: string) { this.selectEl.value = value; }
    val(t: string) { return this; }

    initOptions(options: Option[]) {
        options.forEach((option) => {
            const optEl = document.createElement('option');
            optEl.value = option.value;
            optEl.textContent = option.label;
            this.selectEl.appendChild(optEl);
        });
    }

    set $disabled(d: boolean) {
        this.selectEl.disabled = d;
        this.style({ opacity: d ? '.5' : '1' });
    }

    get $disabled() {
        return this.selectEl.disabled;
    }
    disabled(d: boolean) { return this; }
}
