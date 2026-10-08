import type { MergeConfig } from '../types/conflictTypes.js';
export declare class MergeDriver {
    private readonly config;
    constructor(config: MergeConfig);
    mergeFiles(ancestorFile: string, ourFile: string, theirFile: string): Promise<boolean>;
}
