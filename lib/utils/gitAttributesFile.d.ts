/**
 * Structured view of `.git/info/attributes`. Parsing is lossless for the
 * file shapes we need to handle — comments, blanks, rules, and malformed
 * lines are preserved with their raw text so `serialise(parse(x))` is
 * byte-for-byte equal to `x` for any well-formed input.
 *
 * Attribute semantics follow `git help attributes`:
 *   `attr`       → true   (attribute set)
 *   `-attr`      → false  (attribute unset)
 *   `!attr`      → deleted from the map (unspecified)
 *   `attr=value` → string value
 *
 * We parse enough to reason about merge-driver state; we do NOT attempt
 * glob matching — all pattern comparisons are literal string equality
 * against the plugin's known pattern set.
 */
type AttrValue = string | true | false;
type BlankLine = {
    readonly kind: 'blank';
    readonly raw: string;
};
type CommentLine = {
    readonly kind: 'comment';
    readonly raw: string;
};
export type RuleLine = {
    readonly kind: 'rule';
    readonly pattern: string;
    readonly attrs: ReadonlyMap<string, AttrValue>;
    readonly raw: string;
};
type MalformedLine = {
    readonly kind: 'malformed';
    readonly raw: string;
};
export type Line = BlankLine | CommentLine | RuleLine | MalformedLine;
export type ParsedFile = {
    readonly lines: readonly Line[];
    readonly eol: '\n' | '\r\n';
    readonly hasTrailingNewline: boolean;
};
export declare const parse: (text: string) => ParsedFile;
export declare const serialise: (file: ParsedFile) => string;
/**
 * Read the merge-driver name set by a rule, or undefined if the rule has
 * no `merge=<value>` attribute. A bare `merge` token (no `=`) is treated
 * as invalid and returns undefined, matching git's own tolerance.
 */
export declare const getMerge: (rule: RuleLine) => string | undefined;
/**
 * Append a new rule to the parsed file. Preserves EOL and trailing-newline
 * policy: if the incoming file had no trailing newline, the existing last
 * line is terminated before the new rule is added so the result is still
 * parseable (and ends with the detected EOL for the new rule).
 */
export declare const addRule: (file: ParsedFile, pattern: string, attrs: readonly (readonly [string, AttrValue])[]) => ParsedFile;
/**
 * Return a new RuleLine with the given attribute removed, keeping the
 * pattern and all other attributes intact. Used by uninstall planners to
 * strip `merge=<driver>` from combined lines without losing the user's
 * other attributes.
 */
export declare const ruleWithoutAttr: (rule: RuleLine, attrName: string) => RuleLine;
/**
 * Return a new RuleLine with the given attribute set to `value`. If the
 * attribute already exists on the rule it is overwritten (and the new
 * value is placed at the end of the serialised token order, matching
 * `addRule`'s output). Used by the install-time overwrite policy to
 * swap a conflicting driver to ours without losing the user's other
 * attributes on the same line.
 */
export declare const ruleWithAttr: (rule: RuleLine, attrName: string, value: AttrValue) => RuleLine;
export {};
