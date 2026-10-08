import type { MergeConfig } from '../../types/conflictTypes.js';
import type { JsonObject } from '../../types/jsonTypes.js';
import type { MergeResult } from '../../types/mergeResult.js';
import type { MergeNode } from './MergeNode.js';
export declare class PropertyMergeNode implements MergeNode {
    private readonly ancestor;
    private readonly local;
    private readonly other;
    private readonly attribute;
    constructor(ancestor: JsonObject, local: JsonObject, other: JsonObject, attribute: string);
    merge(config: MergeConfig): MergeResult;
}
