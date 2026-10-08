import type { JsonValue } from '../types/jsonTypes.js';
import { MergeScenario } from '../types/mergeScenario.js';
export declare const getScenario: (ancestor: JsonValue | undefined, local: JsonValue | undefined, other: JsonValue | undefined) => MergeScenario;
export declare const getScalarScenario: (ancestor: JsonValue | undefined, local: JsonValue | undefined, other: JsonValue | undefined) => MergeScenario;
