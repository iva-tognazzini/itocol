import { ThangAny } from "../Thang";
import { GraspThang } from "./GraspThang";

export class DimThang<T extends ThangAny> extends GraspThang<T> {
    get innerWidth() { return this.el.clientWidth; }
    set innerWidth(v: number) { this.el.style.width = v + `px`; }
    get innerHeight() { return this.T.___isStage() ? window.innerHeight : this.el.clientHeight; }
    set innerHeight(v: number) { this.el.style.height = v + `px`; }
    get outerWidth() { return this.el.offsetWidth; }
    set outerWidth(v: number) { this.innerWidth = v; }
    get outerHeight() { return this.el.offsetHeight; }
    set outerHeight(v: number) { this.innerHeight = v; }
    get outerTop() { return this.el.offsetTop; }
    get outerLeft() { return this.el.offsetLeft; }
}



