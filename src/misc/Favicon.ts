import { ajaxEndpointExists } from "broo";
import { jotCSS, jotErr } from "joto/lib/jot";

export class Favicon {
	constructor() {
	}
	async init() {
		this.set(`./node_modules/itocol/assets/images/ico.png`);
	}
	set(url: string) {
		// jotCSS(`#88f`, `ico at ${url}`)
		let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
		if (!link) {
			link = document.createElement('link');
			document.getElementsByTagName('head')[0].appendChild(link);
		}
		link.type = url.endsWith(`.png`) ? `image/png` : `image/x-icon`;
		link.rel = 'icon';
		link.href = url;
	}
}