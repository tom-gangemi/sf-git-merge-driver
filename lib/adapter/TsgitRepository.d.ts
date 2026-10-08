import { type GitRepository } from './GitRepository.js';
export declare const withGitRepository: <T>(use: (repo: GitRepository) => Promise<T>) => Promise<T>;
