/**
 * Deep equality for JSON-shaped values (iterative, stack-safe).
 * Accepts `unknown` to match the signature of `fast-equals.deepEqual` it replaces;
 * non-JSON values (functions, symbols, class instances) fall through the primitive/
 * object checks and return false unless strictly `===`.
 *
 * Key order in objects is irrelevant; array element order IS significant
 * (per JSON semantics).
 */
export declare function jsonEqual(a: unknown, b: unknown): boolean;
