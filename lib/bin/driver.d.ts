import type { MergeConfig } from '../types/conflictTypes.js';
export declare function assertNodeVersion(versionString: string): void;
export type ParsedArgs = {
    ancestorFile: string;
    localFile: string;
    otherFile: string;
    /** Accepted for git-merge-driver contract compliance; MergeDriver writes to localFile (%A). */
    outputFile: string;
    config: MergeConfig;
};
export declare function parseArgs(argv: readonly string[]): ParsedArgs;
export declare function main(argv: readonly string[]): Promise<number>;
