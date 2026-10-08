import type { JsonArray, JsonObject } from '../../types/jsonTypes.js';
export type KeyExtractor = (item: JsonObject) => string;
export declare const buildKeyedMap: (arr: JsonArray, keyField: KeyExtractor) => Map<string, JsonObject>;
/**
 * Fused pass: builds a keyed Map of each array AND collects the union of
 * keys in a single traversal per array. Replaces three `buildKeyedMap`
 * calls plus a separate `collectAllKeys` loop, halving the `keyField`
 * extractor invocations on the merge hot path.
 */
export declare const indexKeyedArrays: (ancestor: JsonArray, local: JsonArray, other: JsonArray, keyField: KeyExtractor) => {
    keyedAncestor: Map<string, JsonObject>;
    keyedLocal: Map<string, JsonObject>;
    keyedOther: Map<string, JsonObject>;
    allKeys: Set<string>;
};
