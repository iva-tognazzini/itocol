import { ListCss } from "broo/o/dom";
import { jotErr } from "joto/lib/jot";
import { anyNAP } from "joto/lib/jotypes";
import { CH_F } from "../../thang/decor/propertize";
import { Thang } from "../../thang/Thang";
import { AgBrowser } from "./AgBrowser";
import { createJsonEditor } from "./createJsonEditor";


@CH_F
export class AgState extends Thang<``>{
    constructor(readonly br: AgBrowser) {
        super();
        this.class(`ag-state`);
    }

    jsonEditor?: JsonEditor<anyNAP>;
    refresh(state: any) {
        const setClean = () => {
            if (this.jsonEditor)
                this.jsonEditor.set({ json: state });
            cleanIt();
            setTimeout(() => { cleanIt(); }, 2);
            setTimeout(() => { cleanIt(); }, 30);
        }
        if (!this.jsonEditor) {
            this.plainHTML(`<p style="margin:1em;font-size:.8em;">Loading state, please wait...</p>`);
            // debugger;
            setTimeout(() => {
                this.plainHTML(``);
                this.jsonEditor = createJsonEditor({
                    target: this.el,
                    props: {
                        content: { json: state },
                        onChange: this.onEdited,
                        // onChange: (state: anyNAP, previousContent: anyNAP,
                        //     more: { contentErrors: any, patchResult: any }) => {
                        //     jot(`updatedContent is: ${o2sB(state)}`);
                        // },
                    }
                });
                cleanIt();
            }, 300);
        } else {
            setTimeout(() => setClean(), 200);
        }
        function cleanIt() {
            document.querySelector(`.jse-navigation-bar`)?.remove();
        }
        // this.$plainHTML = o2sB(state);
    }
    onEdited = (newValue_: anyNAP) => {
        const newState = { ...(newValue_ as any).json };
        delete newState.sys;
        this.br.en.currentState = newState;
        this.br.reload().catch(jotErr);
        this.br.en.saveState(undefined, newState).catch(jotErr);
        // debugger;
    }
    override ownCss(): ListCss {
        const wid = `190px`;
        return {
            ".ag-state": {
                "--jse-theme-color": `#333;`,
                "--jse-theme-color-highlight": `#aaa;`,
                // "--jse-font-size": `24px;`,
                // "--jse-font-size-mono": `24px;`,
                // minWidth: wid,
                // width: wid,
                width: `100%`,
                flexGrow: `1`,
                // whiteSpace: `pre-wrap;`,// breaks the json editor
                wordWrap: `break-word;`,
                // color: `#5f7`,
                padding: `0`,
                // fontFamily: `Consolas, Monaco, 'Courier New', monospace;`,
                overflow: `hidden`,
            }
        }
    }
}


