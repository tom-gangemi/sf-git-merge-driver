import { __decorate } from "tslib";
import { readFile, writeFile } from 'node:fs/promises';
import { withGitRepository } from '../adapter/TsgitRepository.js';
import { DRIVER_NAME } from '../constant/driverConstant.js';
import { parse, ruleWithoutAttr, serialise, } from '../utils/gitAttributesFile.js';
import { getGitAttributesPath } from '../utils/gitAttributesPath.js';
import { log } from '../utils/LoggingDecorator.js';
import { Logger } from '../utils/LoggingService.js';
import { planUninstall } from './GitAttributesPlanner.js';
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
export const applyUninstallPlan = (lines, plan) => {
    const drop = new Set();
    const rewrite = new Set();
    const restore = new Map();
    for (const action of plan.actions) {
        if (action.kind === 'drop-line')
            drop.add(action.lineIndex);
        else if (action.kind === 'remove-merge-attr')
            rewrite.add(action.lineIndex);
        else
            restore.set(action.lineIndex, action.originalRaw);
    }
    return lines.flatMap((line, index) => {
        if (drop.has(index))
            return [];
        const restoreRaw = restore.get(index);
        if (restoreRaw !== undefined) {
            // The planner captures `originalRaw` from a single parsed rule
            // line, so the round-trip string is guaranteed not to contain a
            // newline. Parsing it yields exactly one line. If a crafted
            // annotation body with an embedded newline ever slipped past
            // the planner, `parse(...).lines[0]` would silently drop the
            // rest — keep the existing line instead to avoid partial
            // restores masquerading as successful ones.
            const restoredLines = parse(restoreRaw).lines;
            const restored = restoredLines.length === 1 ? restoredLines[0] : undefined;
            return restored ? [restored] : [line];
        }
        if (!rewrite.has(index) || line.kind !== 'rule')
            return [line];
        return [ruleWithoutAttr(line, 'merge')];
    });
};
export class UninstallService {
    async uninstallMergeDriver(options = {}) {
        const dryRun = options.dryRun ?? false;
        let removedConfigSection = false;
        if (!dryRun) {
            try {
                // Throws when the merge driver is not installed
                await withGitRepository(repo => repo.removeSection(`merge.${DRIVER_NAME}`));
                removedConfigSection = true;
            }
            catch (error) {
                Logger.error('Merge driver uninstallation failed to cleanup git config', error);
            }
        }
        let gitAttributesPath;
        let plan = { actions: [] };
        let wroteAttributes = false;
        // Read-and-plan is best-effort (file may not exist, or the git-dir
        // lookup may fail in an unusual repo). Write is NOT: a failure to
        // persist uninstall changes must surface to the caller so the user
        // knows the attributes file still references a driver that is now
        // undefined in git config. Splitting the two scopes avoids the
        // uninstall-success-but-silently-inconsistent state.
        let serialised;
        try {
            gitAttributesPath = await getGitAttributesPath();
            const raw = await readFile(gitAttributesPath, { encoding: 'utf8' });
            const parsed = parse(raw);
            plan = planUninstall(parsed);
            if (plan.actions.length > 0 && !dryRun) {
                const nextLines = applyUninstallPlan(parsed.lines, plan);
                serialised = serialise({ ...parsed, lines: nextLines });
            }
        }
        catch (error) {
            Logger.error('Merge driver uninstallation failed to cleanup git attributes', error);
        }
        if (serialised !== undefined && gitAttributesPath !== undefined) {
            await writeFile(gitAttributesPath, serialised);
            wroteAttributes = true;
        }
        return {
            plan,
            dryRun,
            wroteAttributes,
            removedConfigSection,
            gitAttributesPath,
        };
    }
}
__decorate([
    log('UninstallService')
], UninstallService.prototype, "uninstallMergeDriver", null);
//# sourceMappingURL=UninstallService.js.map