import { jot } from "joto/lib/jot"
import { delay } from "joto/lib/sys";
import { CssThang } from "./grasp/CssThang";
import { Stage } from "./Stage";
import { Thang, ThangAny } from "./Thang";
import { Thext } from "./Thext";
import { ThextInput } from "./usual/controls/ThextInput";

export async function thangTest() {

    class Hello extends ThangAny {
        override ownCss() {
            return { '.hello': { color: `#88f`, fontSize: `3em`, fontWeight: `bold` } };
        }
    }
    class Hello2 extends ThangAny {
        override ownCss() {
            return { '.hello': { color: `#f00`, fontSize: `4em` } };
        }
    }
    const root = Stage._.addB(new Thang())
        .on(`got stage`, a => jot(`stage!`, a))
        .on(`got baby`, a => jot(`root has a new baby!`, a))
        .style({
            backgroundColor: `#0008`,
            position: `absolute`,
            padding: `1em`,
            margin: `1em`,

            display: `flex`,
            flexDirection: `row`,
            gap: `0.5em`,
            alignItems: `stretch`,
        });

    const tx = new Thang().class(`.hello`).plainHTML(`Hello!`)
    // .on(`got stage`, a => jot(`stage!`, a))
    // .on(`got mom`, a => jot(`mom!`, a))
    // .on(`lost stage`, a => jot(`lost stage...`, a));
    root.add(tx);



    const inp = root.addB(new ThextInput(true)).val(`yo!`);

    const hello = root.addB(new Hello().plainHTML(`Hello, world!<br>`)).class(`.hello`);
    const a = root.addB(new Thext()).text(`Hi! I will be removed in a moment.`);
    await delay(200);
    root.remove(a);
    await delay(200);
    const b = root.addB(new Thext().text(`I am <b>here</b> to stay.`));
    await delay(300);
    b.style({ fontSize: `2em`, color: `red` });
    hello.unClass(`.hello`);
    await delay(500);
    b.unStyle(`fontSize`);
}
