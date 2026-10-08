import type { JsonArray, JsonObject, JsonValue } from './jsonTypes.js';
export interface ConflictBlock extends JsonObject {
    readonly __conflict: true;
    readonly local: JsonArray;
    readonly ancestor: JsonArray;
    readonly other: JsonArray;
}
export declare const isConflictBlock: (value: JsonValue) => value is ConflictBlock;
export declare const buildConflictBlock: (local: JsonObject | JsonArray, ancestor: JsonObject | JsonArray, other: JsonObject | JsonArray) => ConflictBlock;
