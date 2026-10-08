/**
 * Appends all elements from source arrays to target array.
 * Stack-safe alternative to target.push(...source) which can overflow on large arrays.
 */
export declare const pushAll: <T>(target: T[], ...sources: readonly (readonly T[])[]) => void;
export declare const hasSameOrder: (a: readonly string[], b: readonly string[]) => boolean;
export declare const lcs: (a: readonly string[], b: readonly string[]) => string[];
