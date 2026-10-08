import { ATTR_PREFIX } from '../../constant/parserConstant.js';
import { MetadataService } from '../../service/MetadataService.js';
import { KeyedArrayMergeNode } from './KeyedArrayMergeNode.js';
import { PropertyMergeNode } from './PropertyMergeNode.js';
import { TextArrayMergeNode } from './TextArrayMergeNode.js';
import { TextMergeNode } from './TextMergeNode.js';
const toArray = (v) => v == null ? [] : Array.isArray(v) ? v : [v];
const isObject = (val) => typeof val === 'object' && val !== null;
const isKnownObject = (...values) => values.some(isObject);
const isStringArray = (...values) => values.some(value => Array.isArray(value) &&
    value.every(el => typeof el === 'string'));
const isPureObject = (val) => 
// Stryker disable next-line ConditionalExpression: only read once a side is an object or array, so with no array one is a pure object
// Stryker disable next-line LogicalOperator: only read once a side is an object or array, so with no array one is a pure object
isObject(val) && !Array.isArray(val);
// undefined is scalar: an absent side carries no object or array shape
// either, so it must not block the early exit below.
const isScalar = (val) => val === null || typeof val !== 'object';
// Shared, frozen and prototype-free. The parser builds every node with
// Object.create(null) so that an untrusted XML tag name cannot resolve
// through Object.prototype; a plain {} here would reintroduce that chain
// and make a side that dropped an element look like it still carried
// `constructor`, `toString` and their siblings.
const NO_PROPERTIES = Object.freeze(Object.create(null));
// Only an absent side is normalised. A scalar side is passed through so a
// text-bodied element keeps merging exactly as it did before this helper
// existed; isPureUnknown has already ruled out arrays.
const toPropertyObject = (val) => val == null ? NO_PROPERTIES : val;
const isPureUnknown = (values, hasKeyExtractor) => {
    const hasPureObject = values.some(isPureObject);
    const hasArray = values.some(Array.isArray);
    return !hasKeyExtractor && hasPureObject && !hasArray;
};
const toArrays = (...sides) => sides.map(toArray);
// A leaf trio skips the shape probes below entirely: it is the dominant
// case in Salesforce metadata and can only ever be a TextMergeNode.
const isScalarTrio = (ancestor, local, other, attribute) => isScalar(ancestor) &&
    isScalar(local) &&
    isScalar(other) &&
    !MetadataService.isTextArrayAttribute(attribute);
const hasAttributes = (val) => {
    // Stryker disable next-line ConditionalExpression: for-in over a scalar only yields index keys, never an `@_` one; the guard skips that walk
    if (!isPureObject(val))
        return false;
    for (const key in val) {
        if (key.startsWith(ATTR_PREFIX))
            return true;
    }
    return false;
};
// An attribute only exists on its own element's open tag, so an element
// carrying one (e.g. `<label xsi:nil="true"/>`, parsed as
// `{ '@_xsi:nil': 'true', '#text': '' }`) is merged as one value. A
// property-by-property merge would hand each `@_name` key back to the
// writer as a child element of its own (`<@_xsi:nil>true</@_xsi:nil>`),
// and a text-bodied side would be indexed character by character. A
// repeated element (array side) keeps the array routes below; after matching
// keys, the unordered array strategy applies this rule to each entry too.
export const isAttributedTrio = (ancestor, local, other) => !Array.isArray(ancestor) &&
    !Array.isArray(local) &&
    !Array.isArray(other) &&
    (hasAttributes(ancestor) || hasAttributes(local) || hasAttributes(other));
// The schema override defeats an incidental cardinality check, not the
// shape checks: TextArrayMergeNode compares items by reference and sorts
// them by JSON.stringify, so it only ever holds for scalars.
const isTextArray = (ancestor, local, other, attribute) => isStringArray(ancestor, local, other) ||
    (MetadataService.isTextArrayAttribute(attribute) &&
        !isKnownObject(ancestor, local, other));
const toTextArrayNode = (ancestor, local, other, attribute) => {
    const [ancestorArr, localArr, otherArr] = toArrays(ancestor, local, other);
    return new TextArrayMergeNode(ancestorArr, localArr, otherArr, attribute);
};
const toPropertyNode = (ancestor, local, other, attribute) => new PropertyMergeNode(toPropertyObject(ancestor), toPropertyObject(local), toPropertyObject(other), attribute);
// Reached only when at least one side is an object or array: the scalar
// and text-array routes have already claimed every all-scalar trio.
const toKeyedArrayNode = (sides, attribute, keyField) => {
    const [ancestorArr, localArr, otherArr] = toArrays(...sides);
    return new KeyedArrayMergeNode(ancestorArr, localArr, otherArr, attribute, keyField, MetadataService.isOrderedAttribute(attribute));
};
class DefaultMergeNodeFactory {
    createNode(ancestor, local, other, attribute) {
        if (isScalarTrio(ancestor, local, other, attribute) ||
            isAttributedTrio(ancestor, local, other)) {
            return new TextMergeNode(ancestor, local, other, attribute);
        }
        if (isTextArray(ancestor, local, other, attribute)) {
            return toTextArrayNode(ancestor, local, other, attribute);
        }
        const keyField = MetadataService.getKeyFieldExtractor(attribute);
        if (isPureUnknown([ancestor, local, other], keyField !== undefined)) {
            return toPropertyNode(ancestor, local, other, attribute);
        }
        return toKeyedArrayNode([ancestor, local, other], attribute, keyField);
    }
}
export const defaultNodeFactory = new DefaultMergeNodeFactory();
//# sourceMappingURL=MergeNodeFactory.js.map