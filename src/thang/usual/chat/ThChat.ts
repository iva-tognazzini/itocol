import { jotErr } from "joto/lib/jot"
import { CSSes } from "broo/o/dom";
import { coolBroId } from "broo/o/coolBroId";
import { delay, nextFrame } from "joto/lib/sys";
import { CH_F } from "../../decor/propertize";
import { Thang, Thang_ } from "../../Thang";
import { Thext } from "../../Thext";
import { ThButton } from "../controls/ThButton";
import { ThextInput } from "../controls/ThextInput";
import { ThWindow } from "../win/ThWindow";
import { ThCue } from "./ThCue";
import { getId } from "joto/lib/id";
import { Dict, Immutable } from "joto/lib/jotypes";

const progressIcons = [
	`<span style="opacity:.4">&#128051;</span>`,
	`<span style="opacity:.7">&#128051;</span>`,
	`<span style="opacity:1">&#128051;</span>`,
	`<span style="opacity:.7">&#128051;</span>`,
];

export class ThChatWin extends ThWindow<Thext, ThChat> {
	constructor() {
		super(undefined, new ThChat());
		this.$header.text(`Chat Window`);
		this.style({
			top: `1em`,
			left: `1em`,
			bottom: `1em`,
			right: `1em`,
		});
	}
}

export type MsgUndef = Immutable<Msg> | undefined;

type Msg = {
	timeId: string,
	isMe: boolean,
	text: string,
	src?: string,
	subject?: string,
	tags?: string[],
}

@CH_F export class ThChat extends Thang<`I type` | `I send`>{
	constructor() {
		super(`div`);
		this.class(`th-chat`);
		this.addS(this.divMessages)
			.addB(this.typeHere)
			;
		this.#area.on(`got stage`, _ => this.#area.focus());
	}
	uniqueTimeId() {
		return getId();
	}
	private messages: ThCue[] = [];
	preview(msg: Msg | null) {
		if (this.#previewCue)
			this.#previewCue.leave();
		if (!msg) return;
		if (msg.isMe) throw new Error(`Cannot preview my own message`);
		++this.#previewIdx;
		if (this.#previewIdx >= progressIcons.length) this.#previewIdx = 0;
		msg = { ...msg, text: msg.text + progressIcons[this.#previewIdx] }// `&#128395;` : `&#128396;`) }
		this.divMessages.add(this.#previewCue = new ThCue().msg(msg));
		this.#previewCue.scrollIntoView();
	}
	#previewIdx = 0;
	#previewCue: ThCue | null = null;
	push(...msgs: Msg[]) {
		const pushed: ThCue[] = [];
		for (const msg of msgs) {
			const cue = new ThCue().msg(msg);
			// jot(`msg`, msg);
			this.divMessages.add(cue);
			this.messages.push(cue);
			pushed.push(cue);
		}
		if (pushed.length)
			pushed[pushed.length - 1].scrollIntoView();

		return pushed;
	}
	scrollToBottom() {
		if (this.messages.length)
			this.messages[this.messages.length - 1].scrollIntoView();
	}
	get $placeholder() { return this.#area.$placeholder; }
	set $placeholder(v: string) { this.#area.$placeholder = v; }
	placeholder(v: string) { return this; }
	#area: ThextInput = new ThextInput(true).class(`area`).placeholder(`Type a message`)
		.on(`change`, _ => this.emit(`I type`, this.#area.$val))
		.on(`enter`, _ => { this.#sendMessageAct().catch(jotErr); });
	#sendMessageAct = async () => {
		const area = this.#area, val = area.$val;
		if (!val.trim()) {
			area.val(``);
			return;
		}
		const msg = {
			timeId: this.uniqueTimeId(),
			isMe: true,
			text: val,
		};
		this.push(msg);
		{
			/// if I do not do this, the area cursor will be new lined for some reason:
			area.blur();
			await nextFrame();
			area.val(``);
			await nextFrame();
			area.focus();
			await nextFrame();
		}
		this.emit(`I send`, msg);
	}
	divMessages = new Thang_().class(`messages`);//.html(`Messages`);
	private typeHere = new Thang_().class(`type-here`)
		.addS(this.#area)
		.addS(
			new ThButton().class(`send`).addS(new ThButton().class(`send-ico`).on(`click`, () => {
				this.#sendMessageAct().catch(jotErr);
			}))
		);
	override ownCss(): Dict<CSSes> {
		const x: Dict<CSSes> = {
			".th-chat": {
				display: `flex`,
				flexDirection: `column`,
				backgroundColor: `#0004`,
				// padding: `.5em`,
				// border: `1px solid red`,
			},
			".messages": {
				flex: `1 1 auto`,
				// border: `1px solid #0a0`,
				overflow: `auto`,
				display: `flex`,
				flexDirection: `column`,
				gap: `.5em`,
				padding: `.5em`,
			},
			".type-here": {
				// border: `1px solid magenta`,
				display: `flex`,
				flexDirection: `row`,
				alignItems: `center`,
				flexWrap: `nowrap;`,
				gap: `.3em`,
				padding: `.3em`,
				backgroundColor: `#555d`,
				boxShadow: `-3px -6px 20px 3px #0c0c0c4a`,
			},
			".area": {
				flex: `1 1 auto`,
				// border: `1px solid #ff0`,
			},
			".send": {
				// width: `1.3em;`,
				// height: `1.3em;`,
				// rotate: `-1deg;`,
				cursor: `pointer;`,
				background: `transparent; `,
				border: `none;`,
				padding: `0`,
				borderRadius: `0`,
			},
			".send-ico": {
				width: `1.3em;`,
				height: `1.3em;`,
				background: `transparent`,
				border: `none`,
				rotate: `${-35}deg`,
				// padding: `0`,
				backgroundImage: `url("data:image/svg+xml;utf8,<svg style='stroke:rgb(214, 157, 119);' viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M2 15H18.5C20.43 15 22 16.57 22 18.5C22 20.43 20.43 22 18.5 22C16.57 22 15 20.43 15 18.5V18' stroke-width='1.5' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 12H18.5C20.42 12 22 10.43 22 8.5C22 6.58 20.42 5 18.5 5C16.58 5 15 6.57 15 8.5V9' stroke-width='1.5' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 9H9.31C10.8 9 12 7.79 12 6.31C12 4.82 10.79 3.62 9.31 3.62C7.82 3.62 6.62 4.83 6.62 6.31V6.69' stroke-width='1.5' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/></svg>");`,
				// backgroundImage: `url("data:image/svg+xml;utf8,<svg style='stroke:rgb(214, 157, 119);' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M2 15H18.5C20.43 15 22 16.57 22 18.5C22 20.43 20.43 22 18.5 22C16.57 22 15 20.43 15 18.5V18' stroke-width='1.5' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 12H18.5C20.42 12 22 10.43 22 8.5C22 6.58 20.42 5 18.5 5C16.58 5 15 6.57 15 8.5V9' stroke-width='1.5' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 9H9.31C10.8 9 12 7.79 12 6.31C12 4.82 10.79 3.62 9.31 3.62C7.82 3.62 6.62 4.83 6.62 6.31V6.69' stroke-width='1.5' stroke-miterlimit='10' stroke-linecap='round' stroke-linejoin='round'/></svg>");`,
				backgroundRepeat: `no-repeat;`
			},
		}
		return x;

	}
}