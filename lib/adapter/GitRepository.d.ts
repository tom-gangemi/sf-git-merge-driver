export interface GitRepository {
    readonly commonGitDir: string;
    setConfig(key: string, value: string): Promise<void>;
    removeSection(name: string): Promise<void>;
}
export declare class NotAGitRepositoryError extends Error {
    readonly path: string;
    constructor(path: string);
}
