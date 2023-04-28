import { jotErr } from "joto/lib/jot"
import { isStr, o2s } from "joto/lib/sys";
import { sicy2 } from "../misc/sicyStrong";

const END = `~<^END^>~`;
enum Cmd {
	OneToken = `.`,
	FullText = `!`,
}
export const crSockConf = {
	endpoint: `ws://localhost`,
	// endpoint: `ws://45.79.249.151`,
}
const compress = true;
export async function crSock(message: string, callback: (accumulated: string, chunk: string) => void, port = 25449) {
	return new Promise<string>((resolve, reject) => {
		const socket = new WebSocket(`${crSockConf.endpoint}:${port}`);
		socket.onopen = () => {
			socket.send(compress ? `#` + sicy2().encode(message) : message);
		};
		socket.onerror = (event) => {
			jotErr(`socket error`, event);
			reject(event);
		}
		let acc = ``;
		socket.onmessage = (event) => {
			if (!isStr(event.data)) {
				jotErr(`data is not a string, it's a ${typeof event.data} ${o2s(event.data)}`);
				return;
			}
			const chunkSrc = compress ? sicy2().decode(event.data) || event.data : event.data;
			if (chunkSrc === END) {
				socket.close();
				resolve(acc);
			} else if (chunkSrc.startsWith(`ERROR::`)) {
				if (chunkSrc.includes(`with status code`)) {
					socket.close();
					reject(chunkSrc);
				}
			} else {
				const cmd = chunkSrc[0];
				let chunk = chunkSrc.slice(1);
				if (cmd === Cmd.OneToken)
					acc += chunk;
				else if (cmd === Cmd.FullText) {
					acc = chunk;
					chunk = ``;
				}
				callback(acc, chunk);
			}
		};
	});

}