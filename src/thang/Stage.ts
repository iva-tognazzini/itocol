import { CH_F } from "./decor/propertize";
import { Thang, ThangAny } from "./Thang";


@CH_F export class Stage extends ThangAny {
    override ___isStage() { return true; }
    private static self: Stage;
    static get _() { return this.self || (this.self = new Stage()); }
    private constructor() { super(`body`); this.stage = this; }

}