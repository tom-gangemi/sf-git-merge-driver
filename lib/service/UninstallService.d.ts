import { type Line } from '../utils/gitAttributesFile.js';
import { type UninstallPlan } from './GitAttributesPlanner.js';
/**
 * Apply an uninstall plan to a line list:
 *   - `drop-line` removes the line entirely.
 *   - `remove-merge-attr` rewrites the rule line via `ruleWithoutAttr`,
 *     stripping only the `merge=<our-driver>` token and re-serialising
 *     the raw so the user's other attributes on the same line survive.
 *   - `restore-overwrite` re-parses the captured original raw line and
 *     replaces the current line with it, undoing an install-time
 *     overwrite. The paired `drop-line` for the annotation comment
 *     above is emitted by the planner and handled here uniformly.
 */
export declare const applyUninstallPlan: (lines: readonly Line[], plan: UninstallPlan) => Line[];
type UninstallOptions = {
    /**
     * When true, plan the uninstall and return the plan without touching
     * `.git/config` or `.git/info/attributes`.
     */
    readonly dryRun?: boolean;
};
export type UninstallOutcome = {
    readonly plan: UninstallPlan;
    readonly dryRun: boolean;
    readonly wroteAttributes: boolean;
    readonly removedConfigSection: boolean;
    readonly gitAttributesPath: string | undefined;
};
export declare class UninstallService {
    uninstallMergeDriver(options?: UninstallOptions): Promise<UninstallOutcome>;
}
export {};
