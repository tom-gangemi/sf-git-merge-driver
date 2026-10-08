import type { MergeConfig } from '../types/conflictTypes.js';
import type { JsonValue } from '../types/jsonTypes.js';
import type { MergeResult } from '../types/mergeResult.js';
import type { RootKeyInfo } from './MergeContext.js';
import { type MergeNodeFactory } from './nodes/MergeNodeFactory.js';
export declare class MergeOrchestrator {
    private readonly config;
    private readonly nodeFactory;
    constructor(config: MergeConfig, nodeFactory?: MergeNodeFactory);
    merge(ancestor: JsonValue | undefined, local: JsonValue | undefined, other: JsonValue | undefined, attribute?: string, rootKey?: RootKeyInfo): MergeResult;
}
