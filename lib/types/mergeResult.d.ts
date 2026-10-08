import type { JsonArray, JsonValue } from './jsonTypes.js';
export interface MergeResult {
    readonly output: JsonArray;
    readonly hasConflict: boolean;
}
export declare const combineResults: (results: MergeResult[]) => MergeResult;
export declare const noConflict: (output: JsonArray) => MergeResult;
export declare const withConflict: (output: JsonArray) => MergeResult;
export declare const isNonEmpty: (result: MergeResult) => boolean;
export declare const wrapWithRootKey: (result: MergeResult, rootKeyName: string) => MergeResult;
export declare const buildEarlyResult: (value: JsonValue | undefined, rootKeyName?: string) => MergeResult;
