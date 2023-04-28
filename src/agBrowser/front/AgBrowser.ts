import { ajax } from "broo";
import { getId, idToTime } from "joto/lib/id";
import { jot, jotClr, jotErr } from "joto/lib/jot";
import { Dict } from "joto/lib/jotypes";
import { nextFrame, o2s, o2sB, pause, s2o } from "joto/lib/sys";
import { defaultSysModelConf, sysPrompt } from "../../net/sysPrompt";
import { CH_F } from "../../thang/decor/propertize";
import { Dragger } from "../../thang/parts/Dragger";
import { Stage } from "../../thang/Stage";
import { pleaseWait, Thang, ThangAny, Thang_ } from "../../thang/Thang";
import { Thext } from "../../thang/Thext";
import { ThChat } from "../../thang/usual/chat/ThChat";
import { ThButton } from "../../thang/usual/controls/ThButton";
import { ThCheckbox } from "../../thang/usual/controls/ThChechbox";
import { ThextInput } from "../../thang/usual/controls/ThextInput";
import { Thlex } from "../../thang/usual/Thlex";
import { ThWindow } from "../../thang/usual/win/ThWindow";
import { AgEngine, AgResponse } from "../sys/AgEngine";
import { agParseLinks, getAgentName, getBaseAgentPath, getUrlPath } from "../sys/AgParseLinks";
import { Emu } from "../sys/Emu";
import { microServer } from "../sys/interf/AgMicroServer";
import { AgModel, AgModOnChangedObj } from "./AgModel";
import { agOpenLink } from "./AgOpenLink";
import { AgState } from "./AgState";

export async function launchAgBrowser(agentUrl: string) {
	// await testSysPrompt();
	// testTokenizer();
	const { bro, go } = hashSync(new AgBrowser(),
		// `http://./src/ag.dyn/secretary.ag/index~~hello+can+you+please+help+me?`
		agentUrl
		// `http://./src/ag.dyn/cheatsheet.ag/index?weather=sunny&sky=clear~~hello+can+you+please+help+me?`
		// `http://./src/ag.dyn/cheatsheet.ag/more/messages?weather=sunny&sky=clear~~hello+can+you+please+help+me?`
	);
	const STEP_BY_STEP = !false;
	bro.stepByStepMode = true;
	await go();
	bro.stepByStepMode = STEP_BY_STEP;

	const path = bro.$url;
	const agentRoot = getBaseAgentPath(path);
	const agName = getAgentName(path);
	const splAt = bro.stepByStepMode ? `12em` : `36em`, pad = `.3em`;
	const chatWin = new (class ThChatWin extends ThWindow<Thext, ThChat> {
		constructor() {
			super(undefined, new ThChat());
			this.$header.text(`Dev Chat with <span class=ai>${agName}</span>`);
			this.style({ inset: pad, minWidth: `10em`, width: splAt, });
		}
	})();
	const chat = chatWin.$cont;
	chat.placeholder(`Type a message as a HUMAN...`);
	chat.on(`I send`, o => {
		const msg = o.text.trim().urlEnc;
		location.hash = `${agentRoot}~~${msg}`;
		if (bro.stepByStepMode)
			focusEl(broWin);
	});
	chat.addS(new Thang_(`label`).addS(new ThCheckbox({ checked: !STEP_BY_STEP }).on(`change`, (v: ThCheckbox) => {
		bro.stepByStepMode = !v.checked;
	})).addS(new Thext().style({ fontSize: `.8em` }).text(`auto reply`)));
	const messagesHash: Dict<true> = {};
	function transferMessage(result: AgResponse) {
		return { isMe: false, text: result.output!.text, timeId: result.output!.time.toString(36) + `_` + getId().cutFirst(`_`) };
	}
	bro.on(`output progress`, (result: AgResponse) => {
		chat.preview(transferMessage(result));
		jotClr(`#f55`, `output progress: `, `...` + result.output?.text.slice(-30));
		focusEl(chatWin);
	});
	bro.on(`output done`, (result: AgResponse) => {
		chat.preview(null);
		const id = result.id;
		if (messagesHash[id]) return;
		messagesHash[id] = true;
		chat.push(transferMessage(result));
		jotClr(`#3a3`, `output done: `, `...` + result.output?.text.slice(-30));
		focusEl(chatWin);
	})
	{
		const dialogue = await bro.en.agMsg.getItems(`display`);
		for (const msg of dialogue) {
			const id = msg.id;
			if (messagesHash[id]) continue;
			messagesHash[id] = true;
			const timeId = idToTime(id).toString(36) + `_` + getId().cutFirst(`_`);
			chat.push({ isMe: true, text: msg.user, timeId });
			chat.push({ isMe: false, text: msg.ai, timeId });
		}
	}
	const pack = await ajax(`./node_modules/itocol/package.json`);
	const version = pack.failed ? `` : s2o(pack.txt).version;
	const broWin = new ThWindow(
		// null,
		new Thext().text(AgEngine.PROTOCOL_ABBR + ` Browser (v ${version})`),
		bro);
	broWin.style({ inset: pad, left: `calc(${splAt} + ${pad} + ${pad})`, });
	Stage._.addS(broWin).addS(chatWin);
	broWin.resizable(false).draggable(false);
	chatWin.draggable(false).on(`resized`, e => {
		jot(chatWin.dim.innerWidth);
		broWin.style({ left: `calc(${chatWin.dim.innerWidth}px + ${pad}*3)`, });
	});

	function focusEl(t: ThangAny) {
		function gaussian(t: ThangAny, setBlurCss: boolean) {
			const blur = 1;
			t.unStyle(`filter`, `opacity`);
			const cl = `diagonal-lines`;
			t.unClass(cl);
			if (setBlurCss) {
				t.style({
					// filter: `blur(${blur}px)`,
					filter: `brightness(50%)`,
					// opacity: `.4`
				});
				t.class(cl);
			}

			return blur;
		}
		gaussian(t, false);
		const other = t === broWin ? chatWin : broWin;
		gaussian(other, true);
	}

	broWin.on(`focused`, _ => focusEl(broWin));
	chatWin.on(`focused`, _ => focusEl(chatWin));
	setTimeout(() => {
		chat.scrollToBottom();
	}, 1);
	if (!bro.stepByStepMode) focusEl(chatWin);
}

function hashSync(bro: AgBrowser, defaultURL: string) {
	const p = AgEngine.PROTOCOL;
	const hash = () => location.hash.cutFirst(`#`).urlDec;
	const en = bro.en;
	let lastHash = ``;
	bro.on(`path changed`, newUrl => {
		newUrl = en.setUrlVisited(newUrl);
		const h = hash();
		if (h != newUrl) {
			jotClr(`#3c4`, `path changed: url from \n${h} \nto:\n`, newUrl);
			lastHash = newUrl;
			location.hash = newUrl.urlDec.urlEnc;
		}
	});
	async function go() {
		let targetURL = hash();
		if (!targetURL || !targetURL.startsWith(p))
			targetURL = defaultURL;
		if (lastHash !== targetURL) {
			lastHash = targetURL;
			await bro.loadPath(targetURL, false, `finish`);
			jotClr(`#fa3`, `force hash to\n`, targetURL);
		}
	}
	window.addEventListener(`hashchange`, e => { go().catch(jotErr) });
	return { bro, go };
}

type ProgFin = `progress` | `finish`;

@CH_F
export class AgBrowser extends Thang<`path changed` | `output done` | `output progress`>{
	sideProps: Thlex<any>;
	stepByStepMode = false;
	async generateResponse() {
		const me = this.makeAIRespond, meWait = (_: boolean) => me.text(!_ ? `(or click here to make AI  generate)` : `(please wait, generating...)`).disabled(_);
		const resp = this.#lastResponse;
		if (!resp || !resp.promptPageSource) return alert(`you need to load a itocol page first`);
		const prompt = resp.promptPageSource;
		const conf = { ...this.model.conf, prompt: prompt.slice(0, 30) + `...` };
		delete (conf as any).input_tokens;
		if (!this.stepByStepMode || confirm(`Did you check your model config? Review it:\n${o2sB(conf)}\nIf you are fine with it - click OK to proceed.`)) {
			meWait(true);
			const onProg = (txt: string, done: boolean) => {
				this.aiResponse.$val = txt;
				this.updateAiGotoLink(txt);
				if (!this.stepByStepMode)
					this.backToChat(done ? `finish` : `progress`).catch(jotErr);
			}
			jotClr(`#f0f`, prompt);

			try {
				const res = await sysPrompt({ ...conf, prompt }, (txt, token) => {
					onProg(txt, false);
				});
				meWait(false);
				onProg(res, true);
			} catch (err: any) {
				this.failed(err);
				jotErr(err);
				meWait(false);
			}
		}

	}
	async backToChat(status: ProgFin) {
		const t = this.currentGotoUrl;
		if (t == ``) {
			if (this.stepByStepMode) alert(`You need to have some AI response first`);
		} else {
			// jotClr(`#f0f`, `back to chat (${status}) : ${t}`);
			await (this.stepByStepMode ? this.loadPath(t, false, status) : this.loadPathSmart(t, status));
		}
	}
	constructor() {
		super(`div`);
		(window as any)._ag_open_link = (b: any, x: any, basePath: string) => agOpenLink(b, this, x, basePath);

		this.class(`ag-browser`);
		this.addS(this._url);
		const midCont = this.addB(new Thang(`div`).class(`ag-mid-cont`));
		const dragger = new Dragger();
		const previewCont = new Thlex({ grow: `1` }).style({ overflow: `hidden`, });
		midCont
			.addS(previewCont)
			.addS(dragger)
			.addS(this.sideProps = new Thlex({}).style({ overflow: `hidden`, minWidth: `190px`, width: `190px` })
				.addS(this.state)
				.addS(this.model)
			)
		const previewBottom = new Thlex({ gap: `.3em`, pad: `.3em` }).style({ backgroundColor: `#aaa3`, });
		previewCont
			.addS(this.preview)
			.addB(previewBottom);
		previewBottom
			.addS(new Thlex({ dir: `h`, gap: `1em` }).style({ justifyContent: `center`, })
				.addS(new Thext().text(`Respond as AI `))
				.addS(this.makeAIRespond = new ThButton().style({}).text(`or click here to make AI  generate`)
					.on(`click`, _ => { this.generateResponse().catch(jotErr) })
				).addS(this.tokensTh = new Thext().text(``).style({
					fontSize: `smaller`, marginLeft: `auto`, borderRadius: `.3em`,//border: `1px solid #555`, 
					padding: `.2em`, backgroundColor: `#5556`
				}))

			)
			.addS((this.aiResponse))
			.addS(new Thang().plainHTML(`<small>The text response above is transformed to a link (click to follow):</small>`))
			.addS(this.aiGotoLink = new ThButton().text(`...`).on(`click`, _ => { this.backToChat(`finish`).catch(jotErr); }));


		this.aiResponse.on(`change`, _ => this.updateAiGotoLink(_));
		let stateWidth = 0;
		dragger
			.on(`start drag`, _ => stateWidth = (this.sideProps.dim.innerWidth))
			.on(`drag`, pos => {
				const res = (stateWidth - pos.x) + `px`;
				this.sideProps.el.style.width = this.sideProps.el.style.minWidth = res;
				jot(res);
			});
		this._url.on(`enter`, text => {
			this.loadPath(text, false, `finish`).catch(e => this.failed(e));
		});
		this.#refresherStart();
		this.model.on(`changed`, (_: AgModOnChangedObj) => {
			if (_.k === `input_tokens`) {
				// jot(`input tokens changed to ${parseInt(_.v)}`);
				this.en.input_tokens = parseInt(_.v);
				this.quickReload().catch(this.failed);
			}
		});
		this.model.on(`clear messages`, _ => {
			if (!confirm(`Are you sure you want to clear all messages?`)) return;
			this.en.agMsg.purgeAll().then(_ => {
				location.href = location.href.split(`#`)[0];
			}).catch(jotErr);
		}).on(`compile`, (_: any) => {
			(async () => {
				const agentName = getAgentName(this.currentUrlVerbatim);
				if (!confirm(`Are you sure you want to compile "${agentName}"?`)) return;
				this.style({ opacity: `.2` });
				const agentPath = getBaseAgentPath(this.currentUrlVerbatim);
				pleaseWait(`Compiling agent at "${agentName}"...`, 100);
				await pause(200);
				try {
					const result = await microServer.compile(agentPath.slice(AgEngine.PROTOCOL.length));
					jotClr(`#3fa`, `Compile result`, result);
					alert(`done!\nYour agent bundle is now available at:\n${result.binPath}`);
				} catch (e: any) {
					this.failed(e.message);
					jotClr(`#f33`, `Compile error`, e);
				} finally {
					pleaseWait(false);
					this.style({ opacity: `1` });
				}
			})().catch(jotErr);
		});
	}
	private tokensTh: Thext;
	private aiGotoLink: ThButton;
	private makeAIRespond: ThButton;
	private _url = new ThextInput().class(`ag-url`);
	private aiResponse = new ThextInput(true).class(`ag-ai-response`);
	private preview = new Thext().class(`ag-preview`);
	readonly state = new AgState(this);
	readonly model = new AgModel(defaultSysModelConf());
	private currentGotoUrl = ``;
	private updateAiGotoLink(newText: string) {
		// const basePath = getBaseAgentPath(this.$url).cutFirst(AgEngine.PROTOCOL);
		// const link = !newText ? `...` : convertAiTextToURL(basePath, this.aiResponse.$val, ``);
		this.currentGotoUrl = this.en.aiTextToURL(newText);
		this.aiGotoLink.$text = this.currentGotoUrl ? `.../` + this.currentGotoUrl.getLast(`/`).slice(0, 300) + `...` : `...`;
		// jot(`now ai response is ${newText}`);
	}
	get $url() { return this._url.$val; }
	set $url(url: string) { this._url.$val = url; }
	url(s: string) { return this; }
	en = new AgEngine();
	#veryFirst = true;
	async reload() {
		const url = this.en.currentFullUrl;
		if (!url) this.failed(`No URL to reload`);
		else await this.loadPath(url, false, `finish`);
	}
	async loadPathSmart(url: string, status: ProgFin) {
		const quick = getUrlPath(url) == getUrlPath(this.currentUrlVerbatim);
		await this.loadPath(url, quick, status);
	}
	async quickReload() { await this.loadPath(this.currentUrlVerbatim, true, `finish`); }
	private currentUrlVerbatim = ``;
	/// load path ------------------------
	/// load path ------------------------
	/// load path ------------------------
	/// load path ------------------------
	/// load path ------------------------
	/// load path ------------------------
	/// load path ------------------------
	/// load path ------------------------
	async loadPath(url: string, quick: boolean, status: ProgFin) {
		// jot(`AgBrowser.loadPath(${url})`);
		this.currentUrlVerbatim = url;
		this.#refresherStart();
		this.#loading = true;
		if (!quick) {
			this.tokensTh.$text = ``;
			this.updateAiGotoLink(this.aiResponse.$val = ``);
			this.preview.class(`ag-waiting`);
			this.failed(``);
		}
		url = url.swap(`http://`, AgEngine.PROTOCOL);
		this.$url = url;
		if (!quick) this.emit(`path changed`, url);
		if (!quick) pleaseWait(`Loading <b>${url}</b>...`, this.#veryFirst ? 0 : 500);
		this.en.input_tokens = this.model.conf.input_tokens;
		const result = this.#lastResponse = await this.en.request(url, quick);
		if (!quick) {
			this.state.refresh({ ...this.en.currentState, sys: this.en.sysState });
			await nextFrame();
			this.preview.unClass(`ag-waiting`);
			pleaseWait(false);
		}
		this.#loading = false;
		let needToGenerateResponse = false;
		if (result.error) {
			if (this.#veryFirst && microServer.ok)
				this.#lastFingerprint = await this.en.calcLastTsFingerprint(url);
			this.failed(result.error);
		} else {
			if (result.output?.text) {
				this.preview.$text = /*html*/`<h2>Final output</h2><fieldset style="  border: 1px dashed #00b002;
                background-color: #14651a9c;
                border-radius: 0.3em;padding:2em;"><legend style="color:#fff;font-weight:bold;"
                >This is the response that a user sees in the chat.</legend>${result.output.text}</fieldset>
                ${result.id ? `line id: ${result.id}<br>
                started at: ${new Date(idToTime(result.id)).toISOString()})` : ``}
                `;
				status == `finish` ?
					this.emit(`output done`, result)
					: this.emit(`output progress`, result);
			} else if (result.promptPageSource) {
				const txt = result.promptPageSource;
				try {
					this.preview.$text = agParseLinks(getBaseAgentPath(url), txt, result.id);
					// this.preview.$text = txt;
					const tr = this.en.currentTokensCutResult;
					const okColor = `#0a0`;
					const color = !tr.ok ? `#f44` : tr.linesRemoved ? `orange` : okColor;
					const postStr = (!tr.ok ? `>` : tr.linesRemoved ? `- cut ${tr.linesRemoved} lines to fit` : `<`);
					this.tokensTh.$text = `<span style="color:${color}"><span style="filter:brightness(1.5);font-weight:bold;">${tr.max.reached}</span> tokens ${postStr} ${tr.max.requested}</span>`;
					if (!this.stepByStepMode)
						needToGenerateResponse = true;
				} catch (e: any) {
					this.failed(e.message || o2s(e));
				}
			} else {
				this.preview.$text = `Neither aiOutput nor promptPageSource.<br>Looks like a bug in itocol, ask developer`;
			}
			if (!quick && !this.emuOn) this.#lastFingerprint = await this.en.calcLastTsFingerprint(url);
		}
		if (!quick) await nextFrame();
		this.#veryFirst = false;
		if (needToGenerateResponse)
			await this.generateResponse();
	}
	#lastResponse?: AgResponse;
	#lastFingerprint = ``;
	#loading = false;
	#isRefreshing = false;
	#refresherStart() {
		if (this.#isRefreshing) return;
		this.#isRefreshing = true;
		(async () => {
			while (true) {
				if (!this.emuOn && !this.#loading && this.#lastFingerprint) {
					const fp = await this.en.calcLastTsFingerprint(this.currentUrlVerbatim);
					if (this.#lastFingerprint !== fp) {
						this.#lastFingerprint = fp;
						await this.loadPath(this.en.setUrlVisited(this.$url), false, `finish`);
					}
				}
				await pause(600);
			}
		})().catch(jotErr);
	}
	get emuOn() { return Emu.get(this.currentUrlVerbatim).on; }
	private failed(why: string | Error = ``) {
		if (!why) return;
		if (why instanceof Error) {
			jotErr(why);
			why = why.message;
		}
		pleaseWait(false);
		this.preview.$text = /*html*/`
            <h2 style="color:#d9645e;margin-bottom:.5em;">Error</h2>
                <span style="color:#d9645e;">${why}</span>
                <div style="color:#ccc;font-size:.9rem;border:1px solid #9995;background-color:#0003;padding:.5em;border-radius:.5em;margin-top:1.2em;">If you are confused, check out the "cheatsheet.ag" project. It is pretty simple and illustrates most of the features itocol has to offer.</div>
                    `.split(`\n`).map(x => x.trim()).join(`\n`);
	}
	override ownCss() {
		return {
			".ag-browser": {
				display: `flex`,
				// padding: `.3em`,
				flexDirection: `column`,
				// position: `absolute`,
				inset: `0`,
				// margin: `1em`,
				// backgroundColor: `#222e`,
			},
			".ag-waiting": {
				// add blur to the text:
				// filter: `blur(1px)`,
				color: `#ccc!important`,
			},
			".ag-mid-cont": {
				display: `flex`,
				flexDirection: `row`,
				inset: `0`,
				overflowY: `hidden`,
				backgroundColor: `#0005`,
				height: `100%`,
			},
			".ag-ai-response": {
				flexGrow: `1`,
				borderRadius: `.4em`,
				minHeight: `4em`,
				height: `6em`,
				fontSize: `1em`,
				fontWeight: `bold`,
				color: `#77c0ff`,
				resize: `vertical`,
			},
			".ag-preview": {
				whiteSpace: `pre-wrap;`,
				wordWrap: `break-word;`,
				flexGrow: `1`,
				color: `#ffc`,
				padding: `1em 1.5em`,
				// fontFamily: `Consolas, Monaco, 'Courier New', monospace;`,
				overflow: `hidden scroll`, // by x and by y
			},
			"code": {
				fontFamily: `Consolas, Monaco, 'Courier New', monospace;`,
				fontSize: `.8em`,
				backgroundColor: `#fff1`,
				border: `1px solid #ccc3`,
				borderRadius: `.3em`,
				color: `#f8b`,
			},
			".ag-url": {
				padding: `.4em`,
				margin: `.5em`,
				color: `white`,
			},
			".ag-inline-link": {
				border: `1px solid #0000008f`,
				backgroundColor: `#3dc9ff30`,
				// fontWeight: `bold`,
				color: `#37daf5`,
				// padding: `.2em .0em`,
				borderRadius: `1em`,
				textDecoration: `none`,
				cursor: `pointer`,
			},
			".ag-inline-link:hover": {
				backgroundColor: `#204e60`,
			},
		};
	}
}

