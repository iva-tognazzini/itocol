import { Stage } from "../../Stage";
import { ThWindow } from "./ThWindow";

export async function testThWindow() {
    const win = Stage._.addB(new ThWindow());
    win.style({ top: `1em`, left: `1em`, });
    win.$cont.$plainHTML = `A b c d e `.repeat(111);
    // win.on(`moved`, e => console.log(`moved!`, e))
    // .on(`resized`, e => console.log(`resized!`, e));
}