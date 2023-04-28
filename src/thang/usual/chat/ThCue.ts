import { idToDate } from "joto/lib/id";
import { CH_F } from "../../decor/propertize";
import { Thang, Thang_ } from "../../Thang";
import { Thext } from "../../Thext";
import { MsgUndef } from "./ThChat";


@CH_F
export class ThCue extends Thang_ {
    constructor() {
        super(`div`);
    }
    private _msg?: MsgUndef;
    get $msg(): MsgUndef { return this._msg; }
    set $msg(v: MsgUndef) {
        this._msg = v;
        if (v) {
            this.class(`th-cue`, v.isMe ? `th-cue-me` : `th-cue-not-me`);
            this.addB(new Thext().text(v.text)).class(`text`);
            const info = this.addB(new Thang()).class(`info`);
            const timeStr = idToDate(v.timeId).toISOString().getLast('T').cutLast('.');
            info.addB(new Thext().text(timeStr)).class(`time`);
            if (v.subject)
                info.addB(new Thext().text(v.subject)).class(`subject`);
            if (v.tags)
                v.tags.forEach(t => info.addB(new Thext().text(`#${t}`).class(`tag`)));
        } else {
            this.unClass(`msg`);
            this.removeAll();
        }
    }
    msg(v: MsgUndef) { return this; }
    override ownCss() {
        const c = `1em`;
        return {
            ".th-cue-me": {
                alignSelf: `flex-end`,
                backgroundColor: `#5e5e5ec0;`,
                borderRadius: `${c} 0 ${c} ${c}`,
            },
            ".th-cue-not-me": {
                backgroundColor: `#444b;`,
                borderRadius: `0 ${c} ${c} ${c}`,
            },
            ".th-cue": {
                display: `flex`,
                flexDirection: `column`,
                padding: `.5em .75em`,
                boxShadow: `0px 2px 1px 1px #0c0c0c47;`,
                whiteSpace: `pre-wrap;`,// breaks the json editor
                wordWrap: `break-word;`,

                width: `80%`,
            },
            ".th-cue > .text": {},
            ".th-cue > .info": {
                display: `flex`,
                flexDirection: `row`,
                fontSize: `0.8em`,
                gap: `0.8em`,
                flexWrap: `wrap`,
            },
            ".th-cue > .info > .time": {
                color: `#f74`,
            },
            ".th-cue > .info > .subject": {
                color: `#9c1`,
            },
            ".th-cue > .info > .tag": {
                color: `#a7f`,
            },
        };
    }
}
