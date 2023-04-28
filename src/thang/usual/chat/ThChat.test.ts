import { jotClr, jotCSS } from "joto/lib/jot"
import { nextFrame } from "joto/lib/sys";
import { Stage } from "../../Stage";
import { ThChatWin } from "./ThChat";

export async function testThChat() {
    const chat = Stage._.addB(new ThChatWin()).$cont;
    let last: null | ReturnType<typeof chat.push> = null;
    const intoView = (smooth = true) => last?.pop()?.scrollIntoView(smooth);
    chat.divMessages.$visible = false;
    for (let i = 0; i < 4; i++) {
        last = chat.push({
            timeId: chat.uniqueTimeId(),
            isMe: i % 2 === 0,
            text: `message ${i}`,
            subject: `subject ${i}`,
            tags: [`tag ${i}`, `tag ${i + 1}`],
        });
        if (i % 25 == 0) {
            await nextFrame();
            intoView(false);
        }
    }
    chat.divMessages.$visible = true;
    chat
        .on(`I type`, str => jotClr(`#aaf`, `I type`, str))
        .on(`I send`, str => jotClr(`#aaf`, `I send`, str))
    intoView();
}