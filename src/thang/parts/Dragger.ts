import { Thang, ThangAny } from "../Thang";
import { makeDraggableOnlyEvents } from "../usual/win/HelperWindow";

export class Dragger extends Thang<`start drag` | `drag` | `end drag`>{
    constructor() {
        super();
        this.class(`drag`);
        makeDraggableOnlyEvents(this,
            _ => this.emit(`start drag`, _),
            (diff, ev) => this.emit(`drag`, diff),
            _ => this.emit(`end drag`, _),

        );
        this.plainHTML(`&nbsp;`);
    }
    override ownCss() {
        return {
            ".drag": {
                minWidth: `7px`,
                cursor: `ew-resize`,
                position: `relative`,
                top: `0`,
                right: `0`,
                alignSelf: `stretch`,
                backgroundColor: `#3e3e3e78`,
            }
        }

    }
}


