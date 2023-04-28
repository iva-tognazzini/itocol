import { tokensCount } from "../../tokenizer/tokenizer";
import { AgExample } from "./AgEngine";


export function tokensCutter(prompt: string, max: number, flag = `^`) {
    prompt = encodeExamples(prompt);
    const totalCount = tokensCount(prompt);
    const result = {
        ok: true,
        prompt,
        linesRemoved: 0,
        max: {
            requested: max,
            reached: totalCount,
        },
        log: ``,
    };
    const removable = (l: string) => l.trim().startsWith(flag);
    if (totalCount <= max) {
        finalizeAll();
        return result;
    }
    const lines = prompt.split(`\n`).map(l => ({
        line: l,
        removable: removable(l),
        tokens: tokensCount(l),
    }));
    const textFromLines = () => lines.map(l => l.line).join(`\n`);
    const textWithAllRemovableRemoved = lines.filter(l => !l.removable).map(_ => _.line).join(`\n`);
    const allRemovableRemoved = tokensCount(textWithAllRemovableRemoved);
    if (allRemovableRemoved > max) {
        result.ok = false;
        result.prompt = textWithAllRemovableRemoved;
        result.max.reached = allRemovableRemoved;
        finalizeAll();
        return result;
    }
    const countAll = () => tokensCount(textFromLines());
    while (countAll() > max) {
        // remove the first removable line in "lines":
        const removableIndex = lines.findIndex(l => l.removable);
        if (removableIndex == -1) {
            result.log = `warning: no removable lines found while below the max threshold`;
            break;
        }
        lines.splice(removableIndex, 1);
        result.linesRemoved++;
    }
    result.prompt = textFromLines();
    result.prompt = result.prompt;
    result.max.reached = tokensCount(result.prompt);
    function finalizeAll() {
        result.prompt = result.prompt.split(`\n`).map(l =>
            removable(l)
                ? l.trim().slice(flag.length).trim()
                : l
        ).join(`\n`);
        result.prompt = decodeExamples(result.prompt);
        result.prompt = result.prompt.swapHard(`\n\n\n`, `\n\n`);
        result.prompt = result.prompt.swapEachI(exampleCountI, i => `` + i);
    }
    finalizeAll();
    return result;
}

export function encodeExamples(txt: string) {
    // txt = encodeExamplesOne(txt, `{{#example}}`, `{{/example}}`, true);
    txt = encodeExamplesOne(txt, AgExample.open, AgExample.close, false);
    return txt;
}

export const exampleCountI = `¾exampleI¾`;

function encodeExamplesOne(txt: string, open: string, close: string, keepOpenClose: boolean) {
    // const open = AgExample.open, close = AgExample.close;
    // const open = ``, close = AgExample.close;
    // in, txt everything between open and close must be encoded with with "strEncode":
    // finish this function
    const found = txt.getAllBetween(open, close);
    found.forEach(c => {
        txt = txt.replace(keepOpenClose ? c : open + c + close, `\n^ ` + strEncode(`## EXAMPLE ${exampleCountI}\n${c}`));
    });
    return txt;
}
function decodeExamples(txt: string) {
    return strDecode(txt);
}


function strEncode(s: string) { return s.swap(`\n`, `•`).swap(`^ `, `¡`); }
function strDecode(s: string) { return s.swap(`¡`, ``).swap(`•`, `\n`); }