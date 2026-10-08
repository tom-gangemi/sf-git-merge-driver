import { type ConflictBlock } from '../types/conflictBlock.js';
import type { JsonArray, JsonObject } from '../types/jsonTypes.js';
export declare const buildConflictMarkers: (local: JsonObject | JsonArray, ancestor: JsonObject | JsonArray, other: JsonObject | JsonArray) => ConflictBlock;
