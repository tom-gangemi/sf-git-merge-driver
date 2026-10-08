import { noConflict } from '../../types/mergeResult.js';
// Total coercion, independent of Object.prototype.toString: the parser
// builds compact nodes on Object.create(null) (prototype-pollution guard),
// so an object item reaching this comparator has no inherited toString —
// String(obj) would throw. JSON.stringify needs no prototype method, and
// agrees with String on null ("null"), so null needs no separate arm.
const toComparable = (value) => typeof value === 'object' ? JSON.stringify(value) : String(value);
const compareItems = (a, b) => toComparable(a).localeCompare(toComparable(b));
export class TextArrayMergeNode {
    ancestor;
    local;
    other;
    attribute;
    constructor(ancestor, local, other, attribute) {
        this.ancestor = ancestor;
        this.local = local;
        this.other = other;
        this.attribute = attribute;
    }
    merge(_config) {
        const localSet = new Set(this.local);
        const otherSet = new Set(this.other);
        const ancestorSet = new Set(this.ancestor);
        const resultItems = new Set();
        for (const item of this.ancestor) {
            if (localSet.has(item) && otherSet.has(item))
                resultItems.add(item);
        }
        for (const item of this.local) {
            if (!ancestorSet.has(item))
                resultItems.add(item);
        }
        for (const item of this.other) {
            if (!ancestorSet.has(item))
                resultItems.add(item);
        }
        const merged = [...resultItems]
            .sort(compareItems)
            .map(item => (item == null ? {} : { [this.attribute]: item }));
        return noConflict(merged);
    }
}
//# sourceMappingURL=TextArrayMergeNode.js.map