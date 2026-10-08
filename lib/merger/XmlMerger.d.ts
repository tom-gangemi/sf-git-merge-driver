import type { Readable, Writable } from 'node:stream';
import type { MergeConfig } from '../types/conflictTypes.js';
export declare class XmlMerger {
    private readonly parser;
    private readonly writer;
    private readonly jsonMerger;
    constructor(config: MergeConfig);
    mergeThreeWay(ancestor: Readable, ours: Readable, theirs: Readable, out: Writable, eol?: '\n' | '\r\n'): Promise<{
        hasConflict: boolean;
    }>;
}
