import type { JsonValue } from '../../types/jsonTypes.js';
type ElementAttrs = Readonly<Record<string, string | null>>;
export interface AttrSet {
    readonly attrs: ElementAttrs;
    readonly hasAttrs: boolean;
}
export declare const NO_ATTRS: AttrSet;
export declare class ElementFrame {
    readonly name: string;
    private readonly attrs;
    private readonly hasAttrs;
    private textBuf;
    private grouped;
    constructor(name: string, { attrs, hasAttrs }: AttrSet);
    addText(text: string): void;
    addChild(key: string, value: JsonValue): void;
    toCompact(): JsonValue;
    private writeAttrsInto;
    private writeGroupedInto;
    private writeTextInto;
}
export {};
