import { jot } from "joto/lib/jot";
import { Dict } from "joto/lib/jotypes";
import { isArr, objectMap } from "joto/lib/sys";
import { AgModelConf, PromptConf, SysModelRow, sysModelsConfig } from "../../net/sysPrompt";
import { Thang } from "../../thang/Thang";
import { Thext } from "../../thang/Thext";
import { ThButton } from "../../thang/usual/controls/ThButton";
import { ThextInput } from "../../thang/usual/controls/ThextInput";
import { SelectConf, ThSelect } from "../../thang/usual/controls/ThSelect";
import { ThSliderNum } from "../../thang/usual/controls/ThSlider";
import { Thlex } from "../../thang/usual/Thlex";

type DictCh = Dict<{
	from: any;
	to: any;
}[]>;


type ThProp = ThSelect | ThSliderNum | ThextInput;

export type AgModOnChangedObj = { k: keyof AgModelConf, v: any };

export class AgModel extends Thlex<`changed` | `clear messages` | `compile`>{
	constructor(public conf: AgModelConf) {
		super({ dir: `v`, align: `center`, pad: `.3em`, gap: `.3em` });
		// this.$plainHTML = `model conf!`;
		this.addPair(`model`, `&#128126;`, `model`, new ThSelect(this.#modelConf)
			.style({ width: `100%` }));
		this.addPair(`temperature`, `&#127777;`, `temperature`, new ThSliderNum({ max: 1.2, step: .01 }));
		this.addPair(`input_tokens`, `&#128238;`, `Incoming prompt<br>limit (in tokens)`,
			new ThSliderNum({ min: 300, max: 4000, step: 1, val: 2 ** 11 }));
		this.addPair(`tokens`, `&#128221;`, `Response limit<br>(in tokens)`,
			new ThSliderNum({ min: 1, max: 2 ** 10, step: 1, val: 160 }));
		this.addPair(`top_p`, `&#128285;`, `Top P`, new ThSliderNum({ max: 1, step: .01, val: 1 }));
		this.addPair(`fp`, `&#128251;`, `Frequency penalty`, new ThSliderNum({ min: -2, max: 2, step: .01 }));
		this.addPair(`pp`, `&#128161;`, `Presence penalty`, new ThSliderNum({ min: -2, max: 2, step: .01 }));
		this.addPair(`stop`, `&#9209;`, `Stop words,<br>separated by ${AgModel.stopSeparator}<br><b style=color:#f72>WARNING: spaces count!</b>`,
			new ThextInput(false).style({ padding: `.1em`, width: `100%`, borderRadius: `.2em` }));
		this.addS(new ThButton().plainHTML(`&#128237; clear messages`).on(`click`, () => this.emit(`clear messages`, this)));
		this.addS(new ThButton().plainHTML(`&#9889; compile`).on(`click`, () => this.emit(`compile`, this)));
		this.onModelChange();
		objectMap(this.props, (v, k_) => {
			const k = k_ as keyof AgModelConf;
			const prop = this.props[k];
			if (typeof conf[k] != `undefined`)
				this.set(k, conf[k]);
			// prop.$val = conf[k] + ``;

			(prop as any).on(`change`, (p: any) => this.onPropChange(k, prop, true));
			this.onPropChange(k, prop, false);
		});
	}
	setConf(conf: AgModelConf) {
		this.set(`model`, conf.model);
		objectMap(this.props, (v, k_) => {
			const k = k_ as keyof AgModelConf;
			if (k == `model`) return;
			(this.conf as any)[k] = v.$val;
			this.set(k, conf[k]);
		});
	}
	set(k: keyof AgModelConf, v: any) {
		const prop = this.props[k];
		if (k == `stop` && isArr(v)) v = v.join(AgModel.stopSeparator);
		if (!prop) throw new Error(`no prop ${k}`);
		prop.$val = v + ``;
		this.onPropChange(k, prop, false);
	}
	onPropChange = (k: keyof AgModelConf, p: ThProp, emit: boolean) => {
		// jot(k, p.$val);
		if (k == `input_tokens`) {
			const pTokens = this.props[`tokens`];
			const total = +p.$val + +pTokens.$val;
			if (total > this.currMaxInputTokens)
				pTokens.$val = this.currMaxInputTokens - +p.$val + ``;

		} else if (k == `tokens`) {
			const pTokens = this.props[`input_tokens`];
			const total = +p.$val + +pTokens.$val;
			if (total > this.currMaxInputTokens)
				pTokens.$val = this.currMaxInputTokens - +p.$val + ``;
		} else if (k == `model`) {
			this.onModelChange();
		}
		const resolvedVal =
			k == `stop` ? (p.$val.trim() ? p.$val.split(AgModel.stopSeparator) : []) :
				isNaN(parseFloat(p.$val)) ? p.$val : parseFloat(p.$val);
		(this.conf as any)[k] = resolvedVal;
		if (emit) this.emit(`changed`, { k, v: p.$val });
	};
	private onModelChange() {
		const s = this.props[`model`] as ThSelect;
		const val = s.$val;
		const conf = this.modelConfByName(val);
		const it = this.props[`input_tokens`] as ThSliderNum;
		const ot = this.props[`tokens`] as ThSliderNum;

		if (conf) this.currMaxTokens = conf.max;// Math.round(conf.max / 3);
		ot.sl.$max = `` + this.currMaxTokens;

		if (conf) this.currMaxInputTokens = conf.max - 1;
		it.sl.$max = `` + (this.currMaxInputTokens);
		it.updateValue();
		// jot(`model`, val);
	}
	private currMaxInputTokens = 0;
	private currMaxTokens = 0;
	props: Dict<ThProp> = {};
	addPair<T extends Thang<any>>(key: keyof AgModelConf, ico: string, title: string, thang: T) {
		this.props[key] = thang as any;
		this.addB(new Thlex({ gap: `.3em`, dir: `h`, align: `center`, justify: `center`, width: `100%` }))
			.addS(new Thext().text(`${ico}<span class="tooltip-text">${title}</span>`).class(`tooltip`))
			.addS(thang)

	}
	static readonly stopSeparator = `,`;
	get #modelConf(): SelectConf {
		return {
			options: sysModelsConfig.map(a => ({ value: a.model, label: a.model }))
		};
	}
	modelConfByName(name: string) {
		const m: SysModelRow | undefined = sysModelsConfig.find(a => a.model == name);
		// if (!m) throw new Error(`no model "${name}"`);
		return m;
	}

}


