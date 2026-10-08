import { MergeScenario } from '../types/mergeScenario.js';
const isPresent = (value) => {
    if (value == null)
        return false;
    if (typeof value === 'string')
        return value.length > 0;
    // Stryker disable next-line ConditionalExpression: Object.keys of a dense JSON array has its length; this skips the key list
    // Stryker disable next-line BlockStatement: an array falling through gets the same answer from Object.keys
    if (Array.isArray(value)) {
        return value.length > 0;
    }
    if (typeof value === 'object')
        return Object.keys(value).length > 0;
    return true;
};
// A scalar side is present unless nullish: '' counts as present, unlike
// isPresent, because an empty text element is still a stated value.
const isScalarPresent = (value) => value != null;
const scenarioOf = (present) => (ancestor, local, other) => {
    let scenario = MergeScenario.NONE;
    if (present(ancestor)) {
        scenario |= MergeScenario.ANCESTOR_ONLY;
    }
    if (present(local)) {
        scenario |= MergeScenario.LOCAL_ONLY;
    }
    if (present(other)) {
        scenario |= MergeScenario.OTHER_ONLY;
    }
    return scenario;
};
export const getScenario = scenarioOf(isPresent);
export const getScalarScenario = scenarioOf(isScalarPresent);
//# sourceMappingURL=MergeScenarioFactory.js.map