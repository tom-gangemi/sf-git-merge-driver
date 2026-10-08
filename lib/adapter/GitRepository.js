export class NotAGitRepositoryError extends Error {
    path;
    constructor(path) {
        super(`not a git repository: ${path} — ` +
            'run this command from inside a git working tree');
        this.name = 'NotAGitRepositoryError';
        this.path = path;
    }
}
//# sourceMappingURL=GitRepository.js.map