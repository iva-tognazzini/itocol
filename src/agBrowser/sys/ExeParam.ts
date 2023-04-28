type ObjAny = Record<string, any>

export type ExeQuery<VARS extends ObjAny> = {
	path: string; // the path of a prompt
	vars: VARS; /// the variables from url, like "hey.prompt?a=b&c=d" => {a: "b", c: "d"}
	input: DialogueItem
};

export const codeImportExe = `importExefromitocol`;
export const codeExe = `type _Exe<A, B> = {
    id: any;
    state: A,
    finish: any,
    dialogue: any,
    query: { path: string; vars: B; input: any },
}`

export type Exe<STATE extends ObjAny, VARS extends ObjAny> = {
	id: string; // the id of the page-prompt. Unique among all prompts everywhere, also contains timestamp (first part of the id, encoded in base36). NOTE: this id is changing on every page-prompt! If you need an ID that is fixed to a current dialogue line (which is not changing on every page-prompt), use query.input.id
	state: STATE,
	// "redirect": (newPath: string) => void,
	finish: (text: string) => void,
	dialogue: DialogueItem[], // the dialogue history, NOT including the current user/ai input
	query: ExeQuery<VARS>,
	system: SystemExe,
}

export type SystemExe = {
	parse: any, generate: any, replace: any;
};

export type DialogueItem = {
	user: string,// the text of a human input, unaltered. NOTE: user input always goes first!
	ai: string,// the text of the input from AI. When it is the line in the dialogue history - it goes with all the tags, so AI could use it as examples. However, when the line is the final AI output - all tags and variables are removed, so it can be safely displayed to a human
	id: string,// unique id of this dialogue item (unique globally), also contains timestamp
}

/// example EXE object:

