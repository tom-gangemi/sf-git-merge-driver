import { combineResults, noConflict, wrapWithRootKey, } from '../../types/mergeResult.js';
import { mergePropertyOrder } from '../mergePropertyOrder.js';
import { defaultNodeFactory } from './MergeNodeFactory.js';
// Merges pure objects property-by-property through child nodes.
// Used by MergeNodeFactory for objects without a key extractor (e.g. valueSet, valueSetDefinition).
// Wraps combined output with its attribute key.
// Iteration logic mirrors AbstractMergeStrategy.mergeChildren.
export class PropertyMergeNode {
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
    merge(config) {
        const props = mergePropertyOrder(this.ancestor, this.local, this.other);
        const results = [];
        for (const key of props) {
            const childNode = defaultNodeFactory.createNode(this.ancestor[key], this.local[key], this.other[key], key);
            const childResult = childNode.merge(config);
            results.push(childResult);
        }
        const combined = combineResults(results);
        if (combined.output.length === 0) {
            return noConflict([]);
        }
        return wrapWithRootKey(combined, this.attribute);
    }
}
//# sourceMappingURL=PropertyMergeNode.js.map