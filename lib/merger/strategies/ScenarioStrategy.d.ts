import type { MergeResult } from '../../types/mergeResult.js';
import { MergeScenario } from '../../types/mergeScenario.js';
import type { MergeContext } from '../MergeContext.js';
interface ScenarioStrategy {
    execute(context: MergeContext): MergeResult;
}
export declare const getScenarioStrategy: (scenario: MergeScenario) => ScenarioStrategy;
export {};
