import { jot } from "joto/lib/jot";
import { CH_F } from "../../decor/propertize";
import { Thang } from "../../Thang";
import { Thext } from "../../Thext";
import { Thlex } from "../Thlex";

type ThCheckboxEvents = 'click' | 'change' | 'over' | 'out';

export type CheckboxConf = {
	checked?: boolean;
};

@CH_F
export class ThCheckbox extends Thang<ThCheckboxEvents> {
	constructor(readonly conf: CheckboxConf = {}) {
		super('input');
		this.attr('type', 'checkbox');

		if (conf.checked) {
			this.$checked = conf.checked;
		}

		this.el.addEventListener('click', () => this.emit('click', this));
		this.el.addEventListener('change', () => this.emit('change', this));
		this.el.addEventListener('mouseover', () => this.emit('over', this));
		this.el.addEventListener('mouseout', () => this.emit('out', this));

		this.style({
			padding: '.2em',
		});
	}

	get checkboxEl() {
		return this.el as HTMLInputElement;
	}

	get $checked() {
		return this.checkboxEl.checked;
	}

	set $checked(value: boolean) {
		this.checkboxEl.checked = value;
	}

	checked(value: boolean) {
		this.$checked = value;
		return this;
	}

	set $disabled(value: boolean) {
		this.checkboxEl.disabled = value;
		this.style({ opacity: value ? '.5' : '1' });
	}

	get $disabled() {
		return this.checkboxEl.disabled;
	}

	disabled(value: boolean) {
		this.$disabled = value;
		return this;
	}
}
