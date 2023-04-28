import { ThangAny } from "../Thang";

export class GraspThang<THANG extends ThangAny> {
    // public var T(default,null):Thang;
    // public var _(get, null):Thang;
    // function get__() { return T; }
    constructor(readonly T: THANG) {
        // T = owner;
    }
    get el() { return this.T.el; }

}