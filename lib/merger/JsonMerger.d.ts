import type { MergeConfig } from '../types/conflictTypes.js';
import { type JsonArray, type JsonObject } from '../types/jsonTypes.js';
export declare class JsonMerger {
    private readonly orchestrator;
    constructor(config: MergeConfig);
    mergeThreeWay(ancestor: JsonObject | JsonArray, local: JsonObject | JsonArray, other: JsonObject | JsonArray): {
        output: JsonArray;
        hasConflict: boolean;
    };
}
