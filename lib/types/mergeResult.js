import { pushAll } from '../utils/arrayUtils.js';
const EMPTY_ARRAY = [];
const EMPTY_NO_CONFLICT = {
    output: EMPTY_ARRAY,
    hasConflict: false,
};
export const combineResults = (results) => {
    if (results.length === 1)
        return results[0];
    const output = [];
    let hasConflict = false;
    for (const r of results) {
        pushAll(output, r.output);
        hasConflict = hasConflict || r.hasConflict;
    }
    return { output, hasConflict };
};
export const noConflict = (output) => {
    if (output.length === 0) {
        return EMPTY_NO_CONFLICT;
    }
    return { output, hasConflict: false };
};
export const withConflict = (output) => ({
    output,
    hasConflict: true,
});
export const isNonEmpty = (result) => result.output.length > 0 || result.hasConflict;
export const wrapWithRootKey = (result, rootKeyName) => {
    if (result.output.length > 0) {
        return {
            output: [{ [rootKeyName]: result.output }],
            hasConflict: result.hasConflict,
        };
    }
    return noConflict([{ [rootKeyName]: [] }]);
};
// The merge pipeline emits one single-key wrapper per element, but the parser
// groups repeated siblings under one key as `{tag: [entry1, entry2]}`. An early
// (no-op / single-side) result returns that raw shape verbatim; when the body
// is a single such grouped key the writer treats the array as one element's
// body and collapses the repeats into a single element (e.g. CustomLabels whose
// only child is a repeated `<labels>`). Expand it to one wrapper per entry so
// every sibling survives — the writer handles each entry's own body unchanged.
// An empty array is the empty-element shape (self-closed `<tag/>` on
// output) and is left intact.
const expandGroupedRepeats = (value) => {
    const keys = Object.keys(value);
    if (keys.length !== 1) {
        return [value];
    }
    const key = keys[0];
    const inner = value[key];
    if (!Array.isArray(inner) || inner.length === 0) {
        return [value];
    }
    return inner.map(entry => ({ [key]: entry }));
};
export const buildEarlyResult = (value, rootKeyName) => {
    const content = value == null
        ? []
        : Array.isArray(value)
            ? value
            : expandGroupedRepeats(value);
    if (rootKeyName) {
        return noConflict([{ [rootKeyName]: content }]);
    }
    return noConflict(content);
};
//# sourceMappingURL=mergeResult.js.map