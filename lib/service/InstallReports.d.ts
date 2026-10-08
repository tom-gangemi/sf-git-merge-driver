import type { ConflictPolicy } from './GitAttributesPlanner.js';
import { type InstallOutcome } from './InstallService.js';
import type { UninstallOutcome } from './UninstallService.js';
/**
 * Predicate: should the install command prompt the user interactively
 * for a conflict policy? Pure function — the caller injects the flag
 * state and the TTY gate so this stays testable.
 */
export declare const shouldPromptForPolicy: (input: {
    readonly dryRun: boolean;
    readonly force: boolean;
    readonly onConflict: ConflictPolicy;
    readonly isTTY: boolean;
}) => boolean;
export declare const formatInstallDryRunReport: (outcome: InstallOutcome) => string;
export declare const formatUninstallDryRunReport: (outcome: UninstallOutcome) => string;
