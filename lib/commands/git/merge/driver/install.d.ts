import { SfCommand } from '@salesforce/sf-plugins-core';
import type { ConflictPolicy } from '../../../../service/GitAttributesPlanner.js';
type PolicyPrompt = (conflicts: readonly {
    pattern: string;
    existingDriver: string;
}[]) => Promise<ConflictPolicy>;
/**
 * Map a raw terminal answer to a `ConflictPolicy`. Pure — exported so
 * the answer classifier can be table-tested directly (tight feedback
 * loop for mutation testing); also used by `defaultPolicyPrompt` below.
 */
export declare const parsePromptAnswer: (raw: string) => ConflictPolicy;
export default class Install extends SfCommand<void> {
    static readonly summary: string;
    static readonly aliases: string[];
    static readonly description: string;
    static readonly examples: string[];
    static readonly flags: {
        'dry-run': import("@oclif/core/interfaces").BooleanFlag<boolean>;
        'on-conflict': import("@oclif/core/interfaces").OptionFlag<"abort" | "skip" | "overwrite", import("@oclif/core/interfaces").CustomOptions>;
        force: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    /**
     * Hook for tests — overrides the interactive prompt implementation.
     * Kept protected so test doubles can swap in without going through
     * readline. In production, stdout-isTTY is the gate; in tests the
     * caller supplies a stub.
     */
    protected promptPolicy: PolicyPrompt;
    run(): Promise<void>;
}
export {};
