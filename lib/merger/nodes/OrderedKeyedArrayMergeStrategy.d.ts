import type { MergeConfig } from '../../types/conflictTypes.js';
import type { JsonArray } from '../../types/jsonTypes.js';
import type { MergeResult } from '../../types/mergeResult.js';
import type { KeyExtractor } from './KeyedArrayIndex.js';
import type { KeyedArrayMergeStrategy } from './KeyedArrayMergeStrategy.js';
export declare class OrderedKeyedArrayMergeStrategy implements KeyedArrayMergeStrategy {
    private readonly ancestor;
    private readonly local;
    private readonly other;
    private readonly attribute;
    private readonly keyField;
    constructor(ancestor: JsonArray, local: JsonArray, other: JsonArray, attribute: string, keyField: KeyExtractor);
    merge(config: MergeConfig): MergeResult;
    private buildArrayMergeState;
    private analyzeOrderings;
    /**
     * Finds elements that changed relative order between ancestor and modified arrays.
     * Uses upper triangle optimization to avoid redundant pair comparisons.
     * Complexity: O(n²) for n elements - acceptable for typical metadata array sizes.
     */
    private getMovedElements;
    private processDivergedOrderings;
    /**
     * Computes merged key order by combining disjoint reorderings.
     * Also includes elements added in local or other (not in ancestor).
     * Returns null if concurrent disjoint additions are detected (conflict).
     */
    private computeMergedKeyOrder;
    private processWithSpine;
    /**
     * Processes elements in the given key order, merging each element.
     * Handles elements present in any of the three versions.
     */
    private processKeyOrder;
    /**
     * Merges an element considering it might not exist in all three versions.
     * Handles additions and deletions alongside modifications.
     */
    private mergeElementWithPresenceCheck;
    private wrapKeys;
    private buildFullArrayConflict;
    private processSpine;
    private mergeGap;
    private detectGapConflict;
    private buildGapConflict;
    private mergeGapElements;
    /**
     * Merges a single element based on its presence pattern across versions.
     * Uses ElementPresence enum for readable pattern matching.
     */
    private mergeGapElement;
    private wrapElement;
    private mergeElement;
    private buildElementConflict;
}
