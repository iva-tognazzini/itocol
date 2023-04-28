import { CH_F } from "./decor/propertize";
import { Thang, ThangAny } from "./Thang";

@CH_F export class Thext extends Thang<``> {
    constructor() {
        super(`span`);
    }
    // all getters that start with $ are going to become contents of the corresponding function:
    get $text() { return this.$plainHTML; }
    set $text(t: string) { this.$plainHTML = t; }
    // this is an empty function to be filled. All you need to do is return this. 
    text(t: string) { return this; }
}