import type { MergeConfig } from '../../types/conflictTypes.js';
import type { MergeResult } from '../../types/mergeResult.js';
import { MergeScenario } from '../../types/mergeScenario.js';
interface TextMergeParams {
    readonly config: MergeConfig;
    readonly attribute: string;
    readonly ancestor: unknown;
    readonly local: unknown;
    readonly other: unknown;
}
interface TextMergeStrategy {
    handle(params: TextMergeParams): MergeResult;
}
export declare const getTextMergeStrategy: (scenario: MergeScenario) => TextMergeStrategy;
export {};
