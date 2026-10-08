import { combineResults, noConflict, withConflict, } from '../../types/mergeResult.js';
import { jsonEqual } from '../../utils/jsonEqual.js';
import { buildConflictMarkers } from '../ConflictMarkerBuilder.js';
import { MergeOrchestrator } from '../MergeOrchestrator.js';
import { indexKeyedArrays } from './KeyedArrayIndex.js';
import { defaultNodeFactory, isAttributedTrio } from './MergeNodeFactory.js';
import { OrderedKeyedArrayMergeStrategy } from './OrderedKeyedArrayMergeStrategy.js';
import { TextMergeNode } from './TextMergeNode.js';
// ============================================================================
// Unkeyed Conflict Strategy
// ============================================================================
// No key extractor means individual elements can't be matched across
// versions, so a genuine divergence still falls back to a whole-array
// conflict (documented in the README). But without a same-as-every-other-
// node-type equality check first, this used to conflict unconditionally —
// including when the array itself never changed and only forced a
// recursive walk because an unrelated sibling property differed.
class UnkeyedConflictStrategy {
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
        // No separate "all three equal" branch: when local and other both equal
        // ancestor, this first check already fires and returns `other`, which
        // equals `local` in that case — same outcome as a dedicated branch,
        // one fewer redundant condition for the "all equal" case to hide behind.
        if (jsonEqual(this.ancestor, this.local)) {
            return this.resolved(this.other);
        }
        if (jsonEqual(this.ancestor, this.other)) {
            return this.resolved(this.local);
        }
        if (jsonEqual(this.local, this.other)) {
            return this.resolved(this.local);
        }
        return withConflict([
            buildConflictMarkers({ [this.attribute]: this.local }, { [this.attribute]: this.ancestor }, { [this.attribute]: this.other }),
        ]);
    }
    resolved(value) {
        return noConflict(value.map(item => ({ [this.attribute]: item })));
    }
}
// ============================================================================
// Unordered Strategy
// ============================================================================
class UnorderedKeyedArrayMergeStrategy {
    ancestor;
    local;
    other;
    attribute;
    keyField;
    constructor(ancestor, local, other, attribute, keyField) {
        this.ancestor = ancestor;
        this.local = local;
        this.other = other;
        this.attribute = attribute;
        this.keyField = keyField;
    }
    merge(config) {
        // Fused single-pass traversal — one keyField() call per item instead of
        // two (previously: collectAllKeys + buildKeyedMap both invoked keyField).
        const { keyedAncestor, keyedLocal, keyedOther, allKeys } = indexKeyedArrays(this.ancestor, this.local, this.other, this.keyField);
        const results = [];
        const orchestrator = new MergeOrchestrator(config, defaultNodeFactory);
        for (const key of Array.from(allKeys).sort()) {
            const ancestor = keyedAncestor.get(key);
            const local = keyedLocal.get(key);
            const other = keyedOther.get(key);
            // Most entries are untouched on every side: emit the entry whole, as
            // its own body, which also keeps any attributes on its tag. This
            // skips both the attribute probe below (a key walk per side) and the
            // orchestrator, which would reach the same result.
            if (local !== undefined &&
                jsonEqual(ancestor, local) &&
                jsonEqual(local, other)) {
                results.push(noConflict([{ [this.attribute]: local }]));
                continue;
            }
            // Match repeated entries by key first, then preserve any attributed
            // entry as a whole element, just like the factory's singleton route.
            // TextMergeNode already wraps its value (and each conflict side) with
            // the element name. Absent entries stay undefined so deletions work.
            if (isAttributedTrio(ancestor, local, other)) {
                results.push(new TextMergeNode(ancestor, local, other, this.attribute).merge(config));
                continue;
            }
            const result = orchestrator.merge(ancestor ?? {}, local ?? {}, other ?? {}, this.attribute);
            if (result.output.length > 0) {
                results.push({
                    output: [{ [this.attribute]: result.output }],
                    hasConflict: result.hasConflict,
                });
            }
        }
        return combineResults(results);
    }
}
// ============================================================================
// KeyedArrayMergeNode
// ============================================================================
export class KeyedArrayMergeNode {
    ancestor;
    local;
    other;
    attribute;
    keyField;
    isOrdered;
    constructor(ancestor, local, other, attribute, keyField, isOrdered) {
        this.ancestor = ancestor;
        this.local = local;
        this.other = other;
        this.attribute = attribute;
        this.keyField = keyField;
        this.isOrdered = isOrdered;
    }
    merge(config) {
        if (!this.keyField) {
            return new UnkeyedConflictStrategy(this.ancestor, this.local, this.other, this.attribute).merge(config);
        }
        const strategy = this.isOrdered
            ? new OrderedKeyedArrayMergeStrategy(this.ancestor, this.local, this.other, this.attribute, this.keyField)
            : new UnorderedKeyedArrayMergeStrategy(this.ancestor, this.local, this.other, this.attribute, this.keyField);
        return strategy.merge(config);
    }
}
//# sourceMappingURL=KeyedArrayMergeNode.js.map