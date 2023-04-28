import matter from "gray-matter";
import { objectMap } from "joto/lib/sys";
import { getLeadingWhiteSpaces } from "../../misc/str";
import { encodeExamples } from "./TokensCutter";



function isPlainTextTemplate(txt: string) {
    const obj = matter(txt).data;
    let plain = false
    objectMap(obj, (v, k) => {
        const n = k!.replace(/[-]/g, ``).lower;
        if (n == `contenttype` && v.has(`plain`))
            plain = true;
    });
    return plain;
}

function cutOutHandlebarsComments(hbSrc: string) {
    function cut(open: string, close: string) {
        const comments = hbSrc.getAllBetween(open, close);
        comments.forEach(c => hbSrc = hbSrc.swap(open + c + close, ``));
    }
    cut(`{{!--`, `--}}`);
    cut(`<!--`, `-->`);
    cut(`{{!`, `}}`);
    return hbSrc;
}

/**
 * rules:
 * - if there is just one new line - it is counted as a space
 * - if there are two new lines - it is counted as a new paragraph
 *  - <br> is counted as a new line
 * - <t> is counted as a tab
 * @param txt 
 * @returns 
 */
export function agPreText(txt: string) {
    txt = cutOutHandlebarsComments(txt);
    const data = isolateFrontMatter(txt);
    const R = !isPlainTextTemplate(txt);
    txt = data.content;
    /// remove empty mustaches:
    txt = txt.swap(`{{}}`, ``);
    // return txt;
    txt = txt.swap(`\r\n`, `\n`)
    const par = `¾¾par;`, br = `¾¾br;`;
    // find if there are any lines that start with "I:" and "You:", but have no ^ before them. Insert a ^ before them.
    txt = txt.split(`\n`).map(l => {
        if (l.trim().startsWith(`I: `) || l.trim().startsWith(`You: `) || l.trim().startsWith(`AI: `)) {
            if (!l.trim().startsWith(`^ `))
                l = `^ ` + l;
        }
        return l;
    }).join(`\n`);

    if (R) txt = preLists(txt);

    /// other things:
    if (R) txt = txt.split(`\n`).map(s => s.trim() ? s : ``).join(`\n`)
    txt = txt.swapHard(`\n\n\n`, `\n\n`)
    if (R) txt = txt.swap(`\n\n`, par)
    if (R) txt = txt.swap(`<br>`, br).swap(`<br/>`, br).swap(`<br />`, br);
    if (R) txt = txt.swap(`\n`, ` `);
    // .swapHard(`  `, ` `)
    ///
    if (R) txt = txt.swap(par, `\n\n`);
    if (R) txt = txt.swap(br, `\n`)
    if (R) txt = txt.swapHard(`\n\n\n`, `\n\n`);
    return combineMatter(data.matter, txt);
}

function preLists(txt: string) {
    txt = txt.split(`\n`).map(l => {
        const sp = getLeadingWhiteSpaces(l);
        // if (l.has(`(headline, tagline)`)) debugger;
        l = l.trimmed(` `);
        if (!l) return l;
        const isHash = l.startsWith(`#`);
        if (l.startsWith(`*`) || l.startsWith(`-`) || l.startsWith(`^`) || isHash) {
            // what if they forgot to add a space after the bullet?
            if (l.charAt(1) != ` ` && !isHash)
                l = l.charAt(0) + ` ` + l.slice(1);
            return `<br>` + sp + l;
        }
        return l;
    }).join(`\n`);
    return txt;
}

export function agPostText(txt: string) {
    const { matter, content } = isolateFrontMatter(txt);
    const R = !isPlainTextTemplate(txt);
    txt = content;
    // if (txt.has(`moody`)) debugger;
    // if (txt.has(`An alternative approach to the data gathered by Triple`)) debugger;
    // if (R) txt = txt.swapHard(`  `, ` `);
    function rep(c: string) {
        txt = txt
            .swap(` ${c} `, `${c} `)
            .swap(` ${c}\n`, `${c}\n`)
    }
    `.,:;!?`.split(``).forEach(x => {
        // if (txt.has(`moody`)) debugger;
        rep(x);
    });
    // if (R) txt = txt.swapHard(`  `, ` `);// again, because previous manipulations may have created double spaces
    txt = txt.split(`\n`).map(v => {
        let formatted = false;
        const sp = getLeadingWhiteSpaces(v);
        let s = v.trimmed(` `);
        if (s.startsWith(`-`) || s.startsWith(`*`)) {
            s = sp + s;
            formatted = true;
        } else if (s.startsWith(`^`)) {
            s = `^ ` + s.slice(1).trimmed(` `).capit;
            formatted = true;
        }
        return R || formatted ? s : v;
    }).join(`\n`);
    txt = txt.swapHard(`\n\n\n`, `\n\n`);// also again, same reason
    return combineMatter(matter, txt.trim());
}

function isolateFrontMatter(txt: string) {
    const lines = txt.split(`\n`);
    while (lines.length && !lines[0].trim())
        lines.shift();
    const matter: string[] = [];
    if (lines.length && lines[0].trim() == `---`) {
        lines.shift();
        while (lines.length && lines[0].trim() != `---`) {
            matter.push(lines.shift()!);
        }
        lines.shift();
    }
    return { matter: matter.join(`\n`), content: lines.join(`\n`) };
}
function combineMatter(matter: string, content: string) {
    if (!matter.trim()) return content;
    return `---\n${matter}\n---\n${content}`;
}
/*
//older funcs, for reference:
export function agPreText(txt: string) {
    return txt;
    const replaceTotally = (from: string, to: string) => {
        while (txt.includes(from)) txt = txt.swap(from, to);
    }
    replaceTotally(`{{ `, `{{`);
    replaceTotally(`{{\n`, `{{`);
    const onKwd = (kwd: string) => {
        const spl = `{{${kwd}`;
        const arr = txt.split(spl);
        const arr2 = arr.map((x, i) => i == arr.length - 1 ? x : x.trimEnd());
        txt = arr2.join(spl);
    };
    onKwd(`#each`)
    onKwd(`#if`);
    onKwd(`/each`)
    onKwd(`/if`);
    return txt;
}

export function agPostText(txt: string) {
    return txt;
    const replaceHard = (from: string, to: string) => {
        while (txt.includes(from)) txt = txt.swap(from, to);
    }
    const moveSpacesBack = (arr: string[]) =>
        arr.forEach(x => {
            replaceHard(` ${x}`, `${x} `);
            replaceHard(`${x}  `, `${x} `);
            replaceHard(`${x} ${x}`, `${x}${x}`);
        });
    txt = txt.split(`\n`).map(line => {
        // if (line.has(`add task`)) debugger;
        // condense all spaces between words to one, but not in the start of a line:
        let preSp = 0;
        while ((line[preSp] || ``).isSpace)
            preSp++;
        while (line.includes(`  `)) line = line.swap(`  `, ` `);
        return ` `.repeat(preSp) + line;
    }).join(`\n`);

    const dotSlash = `¾dot-slash¾`;
    txt = txt.swap(`./`, dotSlash);

    moveSpacesBack(`.,!?`.split(``));
    txt = txt.swap(dotSlash, `./`);
    replaceHard(`,,`, `,`);

    return txt;
}
*/
