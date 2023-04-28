import { jot, jotB, jotErr } from "joto/lib/jot";
import { nextFrame } from "joto/lib/sys";
import { Keeper } from "../../misc/keeper";
import { AgEngine, VariantsAiObj } from "./AgEngine";
import { ControlQueryObj, getBaseAgentPath } from "./AgParseLinks";
import { DialogueItem } from "./ExeParam";



export type MemDialogueItem = DialogueItem & ControlQueryObj & VariantsAiObj;

export type MsgFor = `prompt` | `display`;
export const M_PROMPT: MsgFor = `prompt`;
export const M_DISPLAY: MsgFor = `display`;
export class AgMsg {
	constructor(readonly en: AgEngine) {
		// (globalThis as any).agMsg = this;
		// (window as any).showDialogueCache = () => (async () => {
		// 	this.dumpCurrentDialogue();
		// })().catch(jotErr);

	}
	// private dumpCurrentDialogue() {
	// 	if (!this.keeper) throw new Error(`No keeper`);
	// 	(async () => {
	// 		const items = await this.getItems();
	// 		jot(`got ${items.length} dialogue items:`);
	// 		// eslint-disable-next-line no-console
	// 		console.table(items);
	// 	})().catch(jotErr);
	// }
	private lastAgentPath = ``;
	async refresh(newUrl: string) {
		const agentPath = getBaseAgentPath(newUrl);
		if (agentPath !== this.lastAgentPath) {
			this.lastAgentPath = agentPath;
			this.keeper = {
				prompt: new Keeper<MemDialogueItem>(`agMsgP-${agentPath}`),
				display: new Keeper<MemDialogueItem>(`agMsgD-${agentPath}`),
			}

			// ;
		}
		this.__clearCache();
	}
	async getItems(For: MsgFor, answersForPromptKey = ``) {
		const keeper = this.keeper[For];
		if (!keeper) throw new Error(`No keeper for "${For}"`);
		if (this.___cache[For].length) return renderIfNeeded(this.___cache[For]);
		const items = await keeper.getMany(() => true);
		// sort items by id, which is string, asc:
		items.sort((a, b) => a.id.localeCompare(b.id));
		return renderIfNeeded(this.___cache[For] = items);
		function renderIfNeeded(lines: typeof items) {
			if (!answersForPromptKey) return lines.map(x => ({ ...x, ai: unpack(x.ai) }));
			const rendered: typeof lines = [];
			for (const item of lines) {
				const chosen = item.aiVariants[answersForPromptKey] || item.ai;
				rendered.push({ ...item, ai: unpack(chosen) });
			}
			return rendered;
		}
		function unpack(s: string) {
			try { return s.urlDecSimple.trimGPT; }
			catch (err) { return s; }
		}
	}

	private ___cache: PromptDisplay<MemDialogueItem[]> = this.__clearCache();
	private __clearCache() {
		return this.___cache = { prompt: [], display: [] };
	}
	async idempotentUpdate(For: MsgFor, item: MemDialogueItem) {
		const items = await this.getItems(For);
		const at = items.findIndex(x => x.id === item.id);
		if (at < 0) items.push(item);
		else items[at] = item;
		await this.keeper[For].set(item.id, item);

	}
	private keeper!: PromptDisplay<Keeper<MemDialogueItem>>;
	async purgeAll() {
		await this.keeper.prompt.purgeAll();
		await this.keeper.display.purgeAll();
		this.__clearCache();
	}
}


type PromptDisplay<A> = {
	prompt: A,
	display: A,
}