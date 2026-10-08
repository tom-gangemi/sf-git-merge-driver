import { type ParsedFile } from '../utils/gitAttributesFile.js';
import { type ConflictPolicy, type InstallPlan } from './GitAttributesPlanner.js';
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
export declare const escapeBinaryPath: (raw: string) => string;
export declare const DRIVER_COMMAND: string;
export declare const DRIVER_NAME_CONFIG_VALUE = "Salesforce source merge driver";
/** Error thrown when the plan contains conflicts and policy is 'abort'. */
export declare class InstallConflictError extends Error {
    readonly conflicts: readonly {
        readonly pattern: string;
        readonly existingDriver: string;
    }[];
    constructor(conflicts: readonly {
        pattern: string;
        existingDriver: string;
    }[]);
}
type InstallOptions = {
    /**
     * When true, plan the install and return the plan without touching
     * `.git/config` or `.git/info/attributes`. The returned plan may
     * contain `conflict` actions — the command layer is responsible for
     * formatting them for the user; no `InstallConflictError` is thrown.
     */
    readonly dryRun?: boolean;
    /**
     * How to handle patterns already owned by another merge driver.
     * Default 'abort' (throw InstallConflictError); 'skip' leaves the
     * user's line alone and does not add ours; 'overwrite' replaces the
     * user's line with ours and inserts an annotation comment so the
     * subsequent uninstall can restore the prior driver.
     */
    readonly onConflict?: ConflictPolicy;
};
export type InstallOutcome = {
    readonly plan: InstallPlan;
    readonly dryRun: boolean;
    /** True when writeFile was called on the attributes file. */
    readonly wroteAttributes: boolean;
    readonly gitAttributesPath: string;
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
export declare const applyInstallPlan: (parsed: ParsedFile, plan: InstallPlan) => ParsedFile;
export declare class InstallService {
    installMergeDriver(options?: InstallOptions): Promise<InstallOutcome>;
}
export {};
