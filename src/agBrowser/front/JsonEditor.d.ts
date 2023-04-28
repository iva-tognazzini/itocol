

declare type JsonEditorParam<T> = {
    target: HTMLElement,
    props: {
        content: T,
        onChange: (updatedContent: any, previousContent: any,
            more: { contentErrors: any, patchResult: any }) => void,

    }
}

declare class JsonEditor<T extends any> {
    private constructor(param: JsonEditorParam<T>);
    set(cont: T): void;
    updateText(txt: string): void;
    get(): T;
    update(cont: T): void;
    focus(): void;
}