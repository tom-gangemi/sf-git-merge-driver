import { __decorate } from "tslib";
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withGitRepository } from '../adapter/TsgitRepository.js';
import { DRIVER_NAME } from '../constant/driverConstant.js';
import { MANIFEST_PATTERNS, METADATA_TYPES_PATTERNS, } from '../constant/metadataConstant.js';
import { addRule, parse, ruleWithAttr, serialise, } from '../utils/gitAttributesFile.js';
import { getGitAttributesPath } from '../utils/gitAttributesPath.js';
import { log } from '../utils/LoggingDecorator.js';
import { OVERWRITE_ANNOTATION_PREFIX, planInstall, } from './GitAttributesPlanner.js';
// Resolved from this compiled module's location:
//   <plugin-root>/lib/service/InstallService.js → ../../bin/merge-driver.cjs
const BINARY_RELATIVE = ['..', '..', 'bin', 'merge-driver.cjs'];
const BINARY_PATH_RAW = join(dirname(fileURLToPath(import.meta.url)), ...BINARY_RELATIVE);
/**
 * Escape a filesystem path for embedding inside the `sh -c '…"…"…'`
 * driver command we store in `git config`. Exported for direct
 * mutation-testing with crafted inputs; the module-level `BINARY_PATH`
 * constant is its only production caller.
 *
 * Escapes (in fixed order, because each stage's output must not
 * re-trigger the next stage):
 *  1. POSIX-normalise: `\` → `/` (Windows join() yields backslashes)
 *  2. Double every `%`: git expands `%O %A %B %P %L %S %X %Y` placeholders
 *     inside the stored driver command before passing it to the shell,
 *     so a literal `%A` in the path would corrupt the substitution.
 *  3. Escape `$` and backtick: sh -c's inner "…${BINARY_PATH}…" context
 *     would otherwise evaluate them as variable/command expansion.
 *  4. Escape `"`: closes the inner double-quote context.
 *  5. Escape `'`: closes the outer sh -c '…' single-quote context (the
 *     POSIX idiom `'\''` is used).
 */
export const escapeBinaryPath = (raw) => raw
    .replace(/\\/g, '/')
    .replace(/%/g, '%%')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
    .replace(/"/g, '\\"')
    .replace(/'/g, "'\\''");
const BINARY_PATH = escapeBinaryPath(BINARY_PATH_RAW);
// git's merge-driver placeholder convention: %O ancestor, %A local, %B other,
// %P output, %L conflict-marker-size, %S ancestor-label, %X local-label,
// %Y other-label. All 8 are passed — this wires %S (new) through to the
// binary's -S flag; previous install omitted %S, forcing the static default.
export const DRIVER_COMMAND = `sh -c 'node "${BINARY_PATH}" -O "$1" -A "$2" -B "$3" -P "$4" -L "$5" -S "$6" -X "$7" -Y "$8"'` +
    ' -- %O %A %B %P %L %S %X %Y';
export const DRIVER_NAME_CONFIG_VALUE = 'Salesforce source merge driver';
const DESIRED_PATTERNS = [
    ...METADATA_TYPES_PATTERNS.map(p => `*.${p}-meta.xml`),
    ...MANIFEST_PATTERNS,
];
/** Error thrown when the plan contains conflicts and policy is 'abort'. */
export class InstallConflictError extends Error {
    conflicts;
    constructor(conflicts) {
        const lines = conflicts.map(c => `  ${c.pattern} is already owned by merge=${c.existingDriver}`);
        super(`Installation aborted: ${conflicts.length} pattern(s) already configured ` +
            `with a different merge driver.\n${lines.join('\n')}`);
        this.name = 'InstallConflictError';
        this.conflicts = conflicts;
    }
}
/**
 * Read `.git/info/attributes` best-effort: a missing file is equivalent
 * to an empty one. Any other I/O error propagates.
 */
const readAttributesOrEmpty = async (path) => {
    try {
        return await readFile(path, { encoding: 'utf8' });
    }
    catch (err) {
        if (err &&
            typeof err === 'object' &&
            err.code === 'ENOENT') {
            return '';
        }
        throw err;
    }
};
/**
 * Apply an install plan to the parsed file:
 *   - Drop dedup lines.
 *   - For each `overwrite` action, replace the existing rule line with
 *     our driver AND insert an annotation comment above it carrying the
 *     original raw, so uninstall can restore.
 *   - For each `add` action, append a new rule at the end.
 *   - `skip` and `skip-conflict` are no-ops for the file — either we
 *     already own the pattern, or we deliberately defer to the existing
 *     driver.
 */
export const applyInstallPlan = (parsed, plan) => {
    const dedup = new Set(plan.dedupDrops);
    const overwrites = new Map();
    for (const action of plan.actions) {
        if (action.kind === 'overwrite')
            overwrites.set(action.lineIndex, action);
    }
    const rewrittenLines = [];
    for (let i = 0; i < parsed.lines.length; i++) {
        if (dedup.has(i))
            continue;
        const existing = parsed.lines[i];
        const overwrite = overwrites.get(i);
        if (!overwrite) {
            rewrittenLines.push(existing);
            continue;
        }
        // The planner only emits `overwrite` for rule lines (see
        // planInstall's conflict branch), but enforce it at runtime so
        // a future planner change surfaces as a loud error instead of
        // a silent .attrs-is-undefined crash inside ruleWithAttr.
        if (existing.kind !== 'rule') {
            throw new Error(`planInstall emitted 'overwrite' for non-rule line at index ${i}: ${existing.kind}`);
        }
        // Insert annotation comment above the rewritten rule.
        const annotation = {
            kind: 'comment',
            raw: `${OVERWRITE_ANNOTATION_PREFIX}${overwrite.originalRaw}`,
        };
        const withOurDriver = ruleWithAttr(existing, 'merge', DRIVER_NAME);
        rewrittenLines.push(annotation, withOurDriver);
    }
    let next = { ...parsed, lines: rewrittenLines };
    for (const action of plan.actions) {
        if (action.kind !== 'add')
            continue;
        next = addRule(next, action.pattern, [['merge', DRIVER_NAME]]);
    }
    return next;
};
export class InstallService {
    async installMergeDriver(options = {}) {
        const dryRun = options.dryRun ?? false;
        const policy = options.onConflict ?? 'abort';
        // Plan first — reading the file and diffing against the desired
        // pattern set is side-effect free, so we can do it up front and
        // bail early for dry-run before touching git config.
        const gitAttributesPath = await getGitAttributesPath();
        const raw = await readAttributesOrEmpty(gitAttributesPath);
        const parsed = parse(raw);
        const plan = planInstall(parsed, DESIRED_PATTERNS, policy);
        if (dryRun) {
            return { plan, dryRun: true, wroteAttributes: false, gitAttributesPath };
        }
        // `conflict` actions only appear when policy === 'abort'; for
        // 'skip' they become `skip-conflict`, for 'overwrite' they become
        // `overwrite`. Surfacing them before any write keeps the abort
        // policy strictly non-destructive.
        const conflicts = plan.actions.flatMap(action => action.kind === 'conflict'
            ? [{ pattern: action.pattern, existingDriver: action.existingDriver }]
            : []);
        if (conflicts.length > 0)
            throw new InstallConflictError(conflicts);
        // git config goes first so the merge driver is defined before any
        // attribute rule references it.
        await withGitRepository(async (repo) => {
            await repo.setConfig(`merge.${DRIVER_NAME}.name`, DRIVER_NAME_CONFIG_VALUE);
            await repo.setConfig(`merge.${DRIVER_NAME}.driver`, DRIVER_COMMAND);
        });
        // Apply plan and write attributes file only if the result differs
        // from what was read — saves an I/O and keeps timestamps stable.
        const next = applyInstallPlan(parsed, plan);
        const after = serialise(next);
        const wroteAttributes = after !== raw;
        if (wroteAttributes) {
            // Apple Git's `git init` doesn't create `.git/info/`, so writeFile
            // would ENOENT on a freshly-initialised repo. Ensure the parent
            // exists before write.
            await mkdir(dirname(gitAttributesPath), { recursive: true });
            await writeFile(gitAttributesPath, after);
        }
        return { plan, dryRun: false, wroteAttributes, gitAttributesPath };
    }
}
__decorate([
    log('InstallService')
], InstallService.prototype, "installMergeDriver", null);
//# sourceMappingURL=InstallService.js.map