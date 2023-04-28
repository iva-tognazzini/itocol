// import GPT3NodeTokenizer from "gpt3-tokenizer";

import { jot } from "joto/lib/jot";
import GPT3BrowserTokenizer from "./gpt3-tokenizer/index-browser";

const tokenizer = new GPT3BrowserTokenizer({ type: 'gpt3' }); // or 'codex'



export function testTokenizer() {
    const str = "What are all the possible and all impossible ways to tokenize a string or dramatize a comedy?";
    const encoded = tokenizer.encode(str);
    const decoded = tokenizer.decode(encoded.bpe);
    jot(`enc:`);
    jot(encoded.text.map(a => `[${a}]`).join(`\n`));
    jot(`DEC`, decoded);
    jot(`total tokens: ${tokensCount(str)}`);

}




export function tokensCount(text: string) {
    return splitToTokens(text).length;
}


export function splitToTokens(text: string) {
    return tokenizer.encode(text).text;
}

