export type OpenTagAttrs = Readonly<Record<string, string | null>>;
export interface LexedOpenTag {
    readonly kind: 'tag';
    readonly name: string;
    readonly attrs: OpenTagAttrs;
    readonly hasAttrs: boolean;
    readonly end: number;
    readonly selfClosing: boolean;
    readonly strayQuote: boolean;
}
interface UnterminatedOpenTag {
    readonly kind: 'unterminated';
}
export type LexOpenTagResult = LexedOpenTag | UnterminatedOpenTag;
export declare const lexOpenTag: (xml: string, pos: number) => LexOpenTagResult;
export {};
