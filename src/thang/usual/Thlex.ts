import { Thang } from "../Thang";


type ConfThlex = {
    dir?: `h` | `v`;// vertical by default
    gap?: string;
    pad?: string;
    grow?: string;
    align?: `flex-start` | `flex-end` | `center` | `stretch` | `baseline`;
    justify?: `flex-start` | `flex-end` | `center` | `stretch` | `space-between` | `space-around` | `space-evenly`;
    width?: string;
}
// this is a thang that has built in flex functionality
export class Thlex<E extends string> extends Thang<E>{
    constructor(conf: ConfThlex = {}) {
        super(`div`);
        this.style({
            display: `flex`,
            flexDirection: conf.dir == `h` ? `row` : `column`,
            gap: conf.gap || `0`,
            padding: conf.pad || `0`,
            flexGrow: conf.grow || `0`,
            alignItems: conf.align || `stretch`,
            justifyContent: conf.justify || `stretch`,
            width: conf.width || `auto`,
        })
    }
}