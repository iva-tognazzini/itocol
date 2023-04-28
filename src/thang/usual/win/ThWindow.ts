import { ListCss } from "broo/o/dom";
import { CH_F } from "../../decor/propertize";
import { Thang, ThangAny, Thang_ } from "../../Thang";
import { Thext } from "../../Thext";
import { makeDraggable, makeResizable } from "./HelperWindow";

type WinEvents = `moved` | `resized` | `focused`;


// this is a floating window that can be dragged around and resized
@CH_F export class ThWindow<HEADER extends ThangAny, CONT extends ThangAny> extends Thang<WinEvents>{
    constructor(header?: HEADER | null, cont?: CONT) {
        super(`div`);
        this.class(`th-window`, `panel`).style({
            // top: `1em`,
            // left: `1em`,
            // width: `300px`,
            // height: `200px`,
            minWidth: `240px`,
            minHeight: `160px`,

        });
        if (header !== null)
            this.$header = header || new Thext().text(`Window header`) as unknown as HEADER;
        this.$cont = cont || new Thext().style({ padding: `.5em` }) as unknown as CONT;
        this.$resizable = true;

        this.el.addEventListener(`focus`, () => this.emit(`focused`, this));
        this.el.addEventListener(`mousedown`, () => this.emit(`focused`, this));

    }
    private dragReleaser = () => { };
    private _header = null as unknown as HEADER;
    get $header() { return this._header; }
    set $header(v: HEADER) {
        if (this._header)
            this._header.leave().unClass(`header`, `panel-header`);

        const wasDraggable = this.$draggable;
        this.dragReleaser();
        this._header = this.addB(v, true).class(`header`, `panel-header`);
        this.$draggable = wasDraggable;
    }
    header() { return this; }
    private _cont = null as unknown as CONT;
    get $cont() { return this._cont; }
    set $cont(v: CONT) {
        if (this._cont) this._cont.leave();
        this._cont = this.addB(v).class(`cont`);
    }
    cont(v: CONT) { return this; }

    private _draggable = true;
    get $draggable() { return this._draggable; }
    set $draggable(v: boolean) {
        this.dragReleaser();
        this._draggable = v;
        if (v)
            this.dragReleaser = makeDraggable(this, this.$header,
                () => { }, () => this.emit(`moved`, this));


    }
    draggable(v: boolean) { return this; }

    private resizeReleaser = () => { };
    private corner?: Thang_;
    get $resizable() { return !!this.corner; }
    set $resizable(v: boolean) {
        if (v) {
            if (!this.corner) {
                this.corner = this.addB(new Thang_()).class(`corner`);
                this.corner.class(`panel-resize-corner`);
                this.resizeReleaser = makeResizable(this, this.corner,
                    () => { }, () => this.emit(`resized`, this));
            }
        } else {
            if (this.corner) {
                this.resizeReleaser();
                this.corner.leave();
                delete this.corner;
            }
        }
    }
    resizable(v: boolean) { return this; }


    override ownCss(): ListCss {
        return {
            ".th-window": {
                position: `absolute`,
                display: `flex`,
                flexDirection: `column`,
                padding: `0`,
                backdropFilter: `blur(.1em)`,
                gap: `0`,
                overflow: `hidden`,
                // boxShadow: `#00000021 0px 2px 2px 2px;`
                // boxShadow: `#0000003d 0px 7px 7px 8px;`,
                boxShadow: `#0000001a 0px 3px 4px 4px;`,
            },
            ".th-window > .header": {
                padding: `0.2em`,
                boxShadow: `#00000061 0px 8px 16px 4px`,
                zIndex: `33`,
                userSelect: `none`
            },
            ".th-window > .cont": {
                overflowY: `auto`,
                // these 3 values represent flex-grow, flex-shrink, flex-basis
                // this makes the cont fill the remaining space of the parent!
                flex: `1 1 auto`,
                boxShadow: `inset #0000004f 0px 0px 2em`,
            },
            ".th-window > .corner": {
                padding: `0`,
                position: `absolute`,
                bottom: `0`,
                right: `0`,
                width: `.8em`,
                height: `.8em`,
                backgroundColor: `var(--panel-corner-color)`,
                userSelect: `none`

            },
        }
    }
}
