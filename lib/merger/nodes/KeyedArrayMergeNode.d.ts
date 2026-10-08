import type { MergeConfig } from '../../types/conflictTypes.js';
import type { JsonArray } from '../../types/jsonTypes.js';
import type { MergeResult } from '../../types/mergeResult.js';
import type { KeyExtractor } from './KeyedArrayIndex.js';
import type { MergeNode } from './MergeNode.js';
export declare class KeyedArrayMergeNode implements MergeNode {
    private readonly ancestor;
    private readonly local;
    private readonly other;
    private readonly attribute;
    private readonly keyField;
    private readonly isOrdered;
    constructor(ancestor: JsonArray, local: JsonArray, other: JsonArray, attribute: string, keyField: KeyExtractor | undefined, isOrdered: boolean);
    merge(config: MergeConfig): MergeResult;
}
