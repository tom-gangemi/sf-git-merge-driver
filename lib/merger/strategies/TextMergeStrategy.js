import { noConflict, withConflict } from '../../types/mergeResult.js';
import { MergeScenario } from '../../types/mergeScenario.js';
import { jsonEqual } from '../../utils/jsonEqual.js';
import { buildConflictMarkers } from '../ConflictMarkerBuilder.js';
// An attribute-bearing element reaches here as an object (see
// MergeNodeFactory.isAttributedTrio), and each side parses it into a
// distinct one, so values compare structurally. Scalars, the hot path,
// settle on identity alone and never pay jsonEqual's stack allocation.
const isSame = (a, b) => 
// Stryker disable next-line ConditionalExpression,LogicalOperator: the identity and object guards only skip jsonEqual, which returns the same answer for any pair they filter out
a === b || (typeof a === 'object' && typeof b === 'object' && jsonEqual(a, b));
const asProperty = (attribute, value) => ({ [attribute]: value });
class OtherOnlyStrategy {
    handle({ attribute, other }) {
        return noConflict([asProperty(attribute, other)]);
    }
}
class LocalOnlyStrategy {
    handle({ attribute, local }) {
        return noConflict([asProperty(attribute, local)]);
    }
}
class LocalAndOtherStrategy {
    handle({ attribute, local, other }) {
        if (isSame(local, other)) {
            return noConflict([asProperty(attribute, local)]);
        }
        return withConflict([
            buildConflictMarkers(asProperty(attribute, local), {}, asProperty(attribute, other)),
        ]);
    }
}
class AncestorAndOtherStrategy {
    handle({ attribute, ancestor, other }) {
        if (!isSame(ancestor, other)) {
            return withConflict([
                buildConflictMarkers({}, asProperty(attribute, ancestor), asProperty(attribute, other)),
            ]);
        }
        return noConflict([]);
    }
}
class AncestorAndLocalStrategy {
    handle({ attribute, ancestor, local }) {
        if (!isSame(ancestor, local)) {
            return withConflict([
                buildConflictMarkers(asProperty(attribute, local), asProperty(attribute, ancestor), {}),
            ]);
        }
        return noConflict([]);
    }
}
class AllPresentStrategy {
    handle({ attribute, ancestor, local, other }) {
        if (isSame(ancestor, local)) {
            return noConflict([asProperty(attribute, other)]);
        }
        if (isSame(ancestor, other)) {
            return noConflict([asProperty(attribute, local)]);
        }
        if (isSame(local, other)) {
            return noConflict([asProperty(attribute, local)]);
        }
        return withConflict([
            buildConflictMarkers(asProperty(attribute, local), asProperty(attribute, ancestor), asProperty(attribute, other)),
        ]);
    }
}
class AncestorOnlyStrategy {
    handle() {
        return noConflict([]);
    }
}
class NoneStrategy {
    handle() {
        return noConflict([]);
    }
}
const strategies = {
    [MergeScenario.NONE]: new NoneStrategy(),
    [MergeScenario.OTHER_ONLY]: new OtherOnlyStrategy(),
    [MergeScenario.LOCAL_ONLY]: new LocalOnlyStrategy(),
    [MergeScenario.LOCAL_AND_OTHER]: new LocalAndOtherStrategy(),
    [MergeScenario.ANCESTOR_AND_OTHER]: new AncestorAndOtherStrategy(),
    [MergeScenario.ANCESTOR_AND_LOCAL]: new AncestorAndLocalStrategy(),
    [MergeScenario.ALL]: new AllPresentStrategy(),
    [MergeScenario.ANCESTOR_ONLY]: new AncestorOnlyStrategy(),
};
export const getTextMergeStrategy = (scenario) => {
    return strategies[scenario];
};
//# sourceMappingURL=TextMergeStrategy.js.map