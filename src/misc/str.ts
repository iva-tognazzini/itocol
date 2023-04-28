import { Dict } from "joto/lib/jotypes";

export function dashToCamelCase(str: string) {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

export function camelToDashCase(str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}


/**
 * this function takes str and replaces all instances of $var with the value of var in glob. The name is terminated by any non-alphanumeric character.
 * Example:
 *    executeInterpolatedString("hello $name, how are you?", { name: "world" }) => "hello world, how are you?"
 
 * @param str 
 * @param glob 
 */
export function executeInterpolatedString(str: string, glob: Dict<any>) {
    // jot(`executeInterpolatedString`, { str, glob });
    const res = str.replace(/\$([a-zA-Z0-9_]+)/g, (g, varName) => {
        // jot(`executeInterpolatedString`, { g, varName });
        if (typeof glob[varName] === "undefined") {
            // debugger;
            throw new Error(`Variable <code>${varName}</code> is not defined in the current context.`);
        }
        return glob[varName];
    });
    // jot(`executeInterpolatedString`, { res });
    return res;



}


export function getLeadingWhiteSpaces(str: string): string {
    let sp = "";
    for (let i = 0; i < str.length; i++) {
        if (str[i] === " " || str[i] === "\t") {
            sp += str[i];
        } else {
            break;
        }
    }
    return sp;
}

