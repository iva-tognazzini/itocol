import { jotErr } from "joto/lib/jot";
import { lewHash32 } from "joto/lib/lewHash";
import { o2s } from "joto/lib/sys";
import { dummyPhrase } from "../../misc/Lingua";
import { Stage } from "../../thang/Stage";
import { Thang_ } from "../../thang/Thang";
import { ThWindow } from "../../thang/usual/win/ThWindow";
import { objLinkToURL, relativePathToAbsolute } from "../sys/AgParseLinks";
import { ExeQuery } from "../sys/ExeParam";
import { AgBrowser } from "./AgBrowser";

const currentlyOpenButtons: HTMLButtonElement[] = [];

export function agOpenLink(btn: HTMLButtonElement, br: AgBrowser, param: ExeQuery<any>, basePath: string) {
	const seed = lewHash32(o2s(param), 1)[0];
	const phrase1 = dummyPhrase(seed, 5), phrase2 = dummyPhrase(
		Math.round(seed ** 1.8), 10);
	killAll();
	const bMe = btn as { popup?: ThWindow<any, any> };
	function mouseOut(_: MouseEvent) {
		killAll(false);
	}
	function onClick(_: MouseEvent) {
		killAll(false);
		param.input.ai = `${phrase1} ${phrase2}`;
		param.path = param.path.cutLast(`.ts`);
		const txtLink = relativePathToAbsolute(basePath, objLinkToURL(param));
		// debugger;
		// pleaseWait(`Loading<br>"<span style=color:#ff0>${txtLink}</span>"...`);
		br.loadPath(txtLink, false, `finish`).then(() => requestAnimationFrame(_ => killAll(false))).catch(jotErr);

	}
	btn.addEventListener(`mouseout`, mouseOut);
	btn.addEventListener(`click`, onClick);
	const cont = new Thang_().style({
		padding: `.7em`,
		fontSize: `.8em`,
		color: `#fff`,
	});
	Stage._.add(bMe.popup = new ThWindow(null, cont));
	bMe.popup.unStyle(`minWidth`, `minHeight`, `width`, `height`, `left`, `top`, `bottom`, `right`,)
		.style({
			width: `21em`,
			//height: `7em`,
			backgroundColor: `#404040f7`,
			border: `1px solid #777`,
		}).resizable(false);

	cont.$plainHTML = /*html*/`Imagine you are AI and you respond to this prompt-page with the following text:<br><br><b style="color:#5f2">${phrase1} ${btn.innerHTML} ${phrase2}</b>`;
	cont.style({ boxShadow: `0 0 1em #000` });


	const boss = btn.parentElement!.parentElement!;
	const btnRect = btn.getBoundingClientRect();
	const bossRect = boss?.getBoundingClientRect();
	if (btnRect.y / bossRect.height > .8)
		putElementAboveAnother(bMe.popup.el, btn);
	else
		putElementBelowAnother(bMe.popup.el, btn);
	moveBackToWindowIfWentOut(bMe.popup.el, boss || undefined);
	currentlyOpenButtons.push(btn);



	function killAll(notMe = true) {
		while (currentlyOpenButtons.length > 0) {
			const b = currentlyOpenButtons.pop()!;
			const b2 = b as { popup?: ThWindow<any, any> };
			if (b2.popup && (!notMe || b !== btn)) {
				b2.popup.leave();
				b.removeEventListener(`mouseout`, mouseOut);
				b.removeEventListener(`click`, onClick);
				b2.popup = undefined;
			}
		}
	}

}


function putElementBelowAnother(el: HTMLElement, other: HTMLElement) {
	const rect = other.getBoundingClientRect();
	el.style.position = `absolute`;
	el.style.left = `${rect.left}px`;
	el.style.top = `${rect.bottom}px`;
}
function putElementAboveAnother(el: HTMLElement, other: HTMLElement) {
	const rect = other.getBoundingClientRect();
	const EL = el.getBoundingClientRect();
	el.style.position = `absolute`;
	el.style.left = `${rect.left}px`;
	el.style.top = `${rect.top - EL.height}px`;
}

function moveBackToWindowIfWentOut(el: HTMLElement, parent?: HTMLElement) {
	if (!parent) return;
	let EL = el.getBoundingClientRect();
	let WIN = parent.getBoundingClientRect();
	// jotB(EL, WIN);
	let max = 1000;
	while (WIN.right < EL.right && max-- > 0) {
		el.style.left = `${+el.style.left.slice(0, -2) - 1}px`;
		EL = el.getBoundingClientRect();
		WIN = parent.getBoundingClientRect();
	}
	max = 1000;
	while (WIN.bottom < EL.bottom && max-- > 0) {
		el.style.top = `${+el.style.top.slice(0, -2) - 1}px`;
		EL = el.getBoundingClientRect();
		WIN = parent.getBoundingClientRect();
	}

}