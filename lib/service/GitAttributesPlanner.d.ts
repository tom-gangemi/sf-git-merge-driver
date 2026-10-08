import { type ParsedFile } from '../utils/gitAttributesFile.js';
/**
 * Prefix that marks a comment line recording the original driver we
 * replaced during an `--on-conflict=overwrite` install. `uninstall`
 * parses this prefix to restore the prior driver's rule line.
 *
 * Shape: `# sf-git-merge-driver overwrote: <original raw line>`
 */
export declare const OVERWRITE_ANNOTATION_PREFIX = "# sf-git-merge-driver overwrote: ";
/**
 * An action in an uninstall plan — what to do with a single line of
 * `.git/info/attributes`. Plans are applied by `UninstallService`, and
 * the shape is also what `--dry-run` renders to the user.
 *
 * `drop-line` is safe (line is pure `<pattern> merge=salesforce-source`
 * or equivalent); `remove-merge-attr` keeps the user's other
 * attributes on the line and only strips our `merge=` token;
 * `restore-overwrite` reverts an install-time overwrite by writing the
 * original raw line back (paired with a `drop-line` for the annotation
 * comment above it).
 */
type UninstallAction = {
    readonly kind: 'drop-line';
    readonly lineIndex: number;
} | {
    readonly kind: 'remove-merge-attr';
    readonly lineIndex: number;
} | {
    readonly kind: 'restore-overwrite';
    readonly lineIndex: number;
    readonly originalRaw: string;
};
export type UninstallPlan = {
    readonly actions: readonly UninstallAction[];
};
/**
 * Walk every rule in the parsed file; for rules whose `merge=` attribute
 * matches our driver, emit the appropriate action. Comments, blanks, and
 * rules for other merge drivers are ignored (no action).
 *
 * Additionally, an annotation comment of the form
 * `# sf-git-merge-driver overwrote: <raw>` immediately above one of our
 * rule lines triggers `restore-overwrite` — the rule is replaced with
 * the captured raw, and the annotation comment is dropped.
 */
export declare const planUninstall: (file: ParsedFile) => UninstallPlan;
/**
 * Conflict policy for `planInstall`.
 *   - `abort`: conflicts appear in the plan as `conflict` actions; the
 *     service refuses to write and surfaces the list to the user.
 *   - `skip`: planner emits `skip-conflict` — the service leaves the
 *     user's line untouched and does NOT add our driver for that glob.
 *   - `overwrite`: planner emits `overwrite` — the service replaces the
 *     user's line with our driver and inserts an annotation comment so
 *     uninstall can restore.
 */
export type ConflictPolicy = 'abort' | 'skip' | 'overwrite';
/**
 * An action in an install plan. Unlike uninstall, install actions do
 * not all carry a `lineIndex` — new rules that don't exist in the file
 * yet have no source line, and `add` is the planner's way of saying
 * "append this pattern at the end".
 */
type InstallAction = {
    readonly kind: 'add';
    readonly pattern: string;
} | {
    readonly kind: 'skip';
    readonly pattern: string;
    readonly lineIndex: number;
} | {
    readonly kind: 'conflict';
    readonly pattern: string;
    readonly existingDriver: string;
    readonly lineIndex: number;
} | {
    readonly kind: 'skip-conflict';
    readonly pattern: string;
    readonly existingDriver: string;
    readonly lineIndex: number;
} | {
    readonly kind: 'overwrite';
    readonly pattern: string;
    readonly existingDriver: string;
    readonly lineIndex: number;
    /** Full raw text of the user's original rule line — used to
     *  build the annotation comment so uninstall can restore. */
    readonly originalRaw: string;
};
/** A diagnostic a planner surfaces on the install path so the command
 *  layer can log a warning without altering the attributes file. */
type PatternDiagnostic = {
    readonly pattern: string;
    readonly lineIndex: number;
};
export type InstallPlan = {
    readonly actions: readonly InstallAction[];
    /**
     * Line indices that are exact duplicates of an already-counted
     * `skip`. Dropped silently during apply — healing for files left
     * with duplicates by the pre-plan install path (or manual edits).
     */
    readonly dedupDrops: readonly number[];
    /**
     * Patterns where a `-text` (text=false) attribute is set on the
     * same glob, which makes git treat matching files as binary and
     * completely bypass any merge driver. Install still proceeds, but
     * our driver will be silently inactive on these patterns until the
     * user removes `-text`. No auto-fix — user decides.
     */
    readonly textAttributeWarnings: readonly PatternDiagnostic[];
    /**
     * Patterns with a commented-out driver line
     * (`# *.profile-meta.xml merge=salesforce-source`). The user
     * explicitly disabled the driver at some point; install still adds
     * a live rule (so the driver works) but the command layer is told
     * so it can surface a warning.
     */
    readonly commentedOutWarnings: readonly PatternDiagnostic[];
};
/**
 * Decide, for each desired pattern, whether we already own it (skip),
 * someone else owns it (conflict / skip-conflict / overwrite), or it's
 * absent (add). Deduplicate redundant copies of our own rule silently.
 *
 * Policy changes only the conflict branch — patterns without competing
 * drivers behave the same regardless of policy.
 */
export declare const planInstall: (file: ParsedFile, desiredPatterns: readonly string[], policy?: ConflictPolicy) => InstallPlan;
export {};
