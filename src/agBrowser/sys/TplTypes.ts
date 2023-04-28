import { Dict } from "joto/lib/jotypes";

export type WithVar = {
    varName: string;
};

export type TplEntry = {
    fullPath: string;
    pos: number;
    txt: string;
};
export type TplDir = WithVar & {
    dirName: string;
    files: TplFile[];
};
export type TplFile = WithVar & {
    fileName: string;
    cont: string;
};
export type TplBaseRet = {
    _text: string;
    _info: string; /// information at the top, above all sections
};
export type TplRet =
    (TplBaseRet & Dict<string>) | string;
