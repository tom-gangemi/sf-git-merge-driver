export const buildKeyedMap = (arr, keyField) => {
    const map = new Map();
    for (const item of arr) {
        const key = keyField(item);
        map.set(key, item);
    }
    return map;
};
/**
 * Fused pass: builds a keyed Map of each array AND collects the union of
 * keys in a single traversal per array. Replaces three `buildKeyedMap`
 * calls plus a separate `collectAllKeys` loop, halving the `keyField`
 * extractor invocations on the merge hot path.
 */
export const indexKeyedArrays = (ancestor, local, other, keyField) => {
    const allKeys = new Set();
    const keyedAncestor = new Map();
    const keyedLocal = new Map();
    const keyedOther = new Map();
    const fill = (arr, target) => {
        for (const item of arr) {
            const obj = item;
            const key = keyField(obj);
            target.set(key, obj);
            allKeys.add(key);
        }
    };
    fill(ancestor, keyedAncestor);
    fill(local, keyedLocal);
    fill(other, keyedOther);
    return { keyedAncestor, keyedLocal, keyedOther, allKeys };
};
//# sourceMappingURL=KeyedArrayIndex.js.map