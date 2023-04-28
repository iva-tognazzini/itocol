/* eslint-disable no-console */
import { jot } from "joto/lib/jot"
import { crSock } from "./CrSock";

export async function testSocket() {
    const list: string[] = [];
    for (let i = 0; i < 4; i++)list.push(Math.random().toString(36).slice(2));
    const res = await crSock(`testSock:` + list.join(` `), (s, a) => {
        console.clear();
        return jot(`typing...\n`, s);
    });
    console.clear();
    jot(`DONE!\n`, res);
}

(window as any).testSocket = testSocket;

// export function testSocket_raw() {
//     // Establish WebSocket connection
//     const socket = new WebSocket("ws://localhost:25449");

//     // Send random number to server
//     socket.onopen = function () {
//         const randomNumber = Math.floor(Math.random() * 100);
//         socket.send(randomNumber + ``);
//     };
//     let text = ``;
//     // Handle incoming message from server
//     socket.onmessage = function (event) {
//         const textfield = document.getElementById("textfield");
//         text += event.data + " ";
//         jot(text);
//     };
// }