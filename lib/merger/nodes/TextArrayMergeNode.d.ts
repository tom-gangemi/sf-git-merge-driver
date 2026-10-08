import type { MergeConfig } from '../../types/conflictTypes.js';
import type { JsonArray } from '../../types/jsonTypes.js';
import type { MergeResult } from '../../types/mergeResult.js';
import type { MergeNode } from './MergeNode.js';
export declare class TextArrayMergeNode implements MergeNode {
    private readonly ancestor;
    private readonly local;
    private readonly other;
    private readonly attribute;
    constructor(ancestor: JsonArray, local: JsonArray, other: JsonArray, attribute: string);
    merge(_config: MergeConfig): MergeResult;
}
