import type { MergeConfig } from '../../types/conflictTypes.js';
import type { JsonValue } from '../../types/jsonTypes.js';
import type { MergeResult } from '../../types/mergeResult.js';
import type { MergeNode } from './MergeNode.js';
export declare class TextMergeNode implements MergeNode {
    private readonly ancestor;
    private readonly local;
    private readonly other;
    private readonly attribute;
    constructor(ancestor: JsonValue | undefined, local: JsonValue | undefined, other: JsonValue | undefined, attribute: string);
    merge(config: MergeConfig): MergeResult;
}
