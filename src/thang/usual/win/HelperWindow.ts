import { jot } from "joto/lib/jot"
import { Stage } from "../../Stage";
import { ThangAny } from "../../Thang";

type Ele = HTMLElement;

export function makeDraggable(th: ThangAny, thHead?: ThangAny, onElDown?: (e: MouseEvent) => void, onElDrag?: (e: MouseEvent) => void, onElUp?: (e: MouseEvent) => void) {

    // console.log(elem, eleHead);

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const dragger = thHead?.el || th.el;
    dragger.addEventListener(`mousedown`, startDragEvent);
    const origCursor = dragger.style.cursor;
    dragger.style.cursor = `move`;

    function startDragEvent(evt: MouseEvent) {
        evt = evt || window.event;
        evt.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = evt.clientX;
        pos4 = evt.clientY;
        document.addEventListener(`mouseup`, closeDragEvent);
        document.addEventListener(`mousemove`, moveDragEvent);
        if (onElDown)
            onElDown(evt);
    }
    const clampPad = 7;
    function moveDragEvent(evt: MouseEvent) {
        evt = evt || window.event;
        evt.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - evt.clientX;
        pos2 = pos4 - evt.clientY;
        pos3 = evt.clientX;
        pos4 = evt.clientY;
        // jot(`elem.offsetTop`, th.dim.outerTop);
        // debugger;
        // set the element's new position:
        th.style({
            left: (th.dim.outerLeft - pos1).clamp(clampPad,
                Stage._.dim.innerWidth - th.dim.outerWidth - clampPad) + "px",
            top: (th.dim.outerTop - pos2).clamp(clampPad,
                Stage._.dim.innerHeight - th.dim.outerHeight - clampPad) + "px",
        });
        onElDrag && onElDrag(evt);

    }

    function closeDragEvent(evt: MouseEvent) {
        // stop moving when mouse button is released:
        document.removeEventListener(`mouseup`, closeDragEvent);
        document.removeEventListener(`mousemove`, moveDragEvent);
        if (onElUp)
            onElUp(evt);
    }
    // the return function must remove all events that it we set here:
    return () => {
        dragger.removeEventListener(`mousedown`, startDragEvent);
        document.removeEventListener(`mouseup`, closeDragEvent);
        document.removeEventListener(`mousemove`, moveDragEvent);
        // also all "onEl..", to let the GC collect them:
        onElDown = onElDrag = onElUp = undefined;
        dragger.style.cursor = origCursor;
    }
}


export function makeResizable(th: ThangAny, corner: ThangAny, onElDown?: (e: MouseEvent) => void, onElDrag?: (e: MouseEvent) => void, onElUp?: (e: MouseEvent) => void) {
    let oX = 0, oY = 0;

    const free = makeDraggable(corner, undefined, e => {
        oX = e.offsetX;
        oY = e.offsetY;
        jot({ oX, oY });
        onElDown && onElDown(e);
    }, e => {
        const cw = corner.dim.innerWidth;
        const ch = corner.dim.innerHeight;
        th.style({
            width: `${e.clientX - th.dim.outerLeft + cw - oX}px`,
            height: `${e.clientY - th.dim.outerTop + ch - oY}px`,
        });
        corner.unStyle(`top`, `left`);
        onElDrag && onElDrag(e);
    }, e => {
        onElUp && onElUp(e);
    });
    corner.style({ cursor: `nwse-resize` });

    return free;
}


type Vec2 = { x: number, y: number };
export function makeDraggableOnlyEvents(th: ThangAny, onElDown?: (e: MouseEvent) => void, onElDrag?: (vec: Vec2, e: MouseEvent) => void, onElUp?: (e: MouseEvent) => void) {

    // console.log(elem, eleHead);

    const dragger = th.el;
    dragger.addEventListener(`mousedown`, startDragEvent);

    const start = { x: -1, y: -1 };
    function startDragEvent(evt: MouseEvent) {
        evt = evt || window.event;
        evt.preventDefault();
        // get the mouse cursor position at startup:
        start.x = evt.clientX;
        start.y = evt.clientY;
        document.addEventListener(`mouseup`, closeDragEvent);
        document.addEventListener(`mousemove`, moveDragEvent);
        if (onElDown)
            onElDown(evt);
    }
    function moveDragEvent(evt: MouseEvent) {
        evt = evt || window.event;
        evt.preventDefault();
        const now = { x: evt.clientX, y: evt.clientY };
        const diff = { x: now.x - start.x, y: now.y - start.y };
        // jot(diff);
        onElDrag && onElDrag(diff, evt);
    }

    function closeDragEvent(evt: MouseEvent) {
        // stop moving when mouse button is released:
        document.removeEventListener(`mouseup`, closeDragEvent);
        document.removeEventListener(`mousemove`, moveDragEvent);
        if (onElUp)
            onElUp(evt);
    }
    // the return function must remove all events that it we set here:
    return () => {
        dragger.removeEventListener(`mousedown`, startDragEvent);
        document.removeEventListener(`mouseup`, closeDragEvent);
        document.removeEventListener(`mousemove`, moveDragEvent);
        // also all "onEl..", to let the GC collect them:
        onElDown = onElDrag = onElUp = undefined;
    }
}
