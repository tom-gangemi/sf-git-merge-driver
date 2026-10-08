import { type JsonArray, type JsonObject } from '../types/jsonTypes.js';
export declare const mergePropertyOrder: (ancestor: JsonObject | JsonArray | null | undefined, local: JsonObject | JsonArray, other: JsonObject | JsonArray) => string[];
