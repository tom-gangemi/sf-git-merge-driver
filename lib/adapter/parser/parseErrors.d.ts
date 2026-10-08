export declare const UNTERMINATED_COMMENT = "XML parse error: unterminated comment";
export declare const UNTERMINATED_DECLARATION = "XML parse error: unterminated <! ... >";
export declare const UNTERMINATED_PROCESSING_INSTRUCTION = "XML parse error: unterminated <? ?>";
export declare const UNTERMINATED_TAG = "XML parse error: unterminated tag";
export declare const unbalancedTags: (finalDepth: number) => string;
export declare const unexpectedCloseTag: (xml: string, gt: number) => string;
