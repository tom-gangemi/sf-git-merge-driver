import { toJsonObjectOrEmpty, } from '../../types/jsonTypes.js';
import { buildEarlyResult, combineResults, noConflict, withConflict, wrapWithRootKey, } from '../../types/mergeResult.js';
import { MergeScenario } from '../../types/mergeScenario.js';
import { jsonEqual } from '../../utils/jsonEqual.js';
import { buildConflictMarkers } from '../ConflictMarkerBuilder.js';
import { MergeOrchestrator } from '../MergeOrchestrator.js';
import { mergePropertyOrder } from '../mergePropertyOrder.js';
// ============================================================================
// Abstract Base Classes
// ============================================================================
class AbstractMergeStrategy {
    mergeChildren(context, ancestor) {
        const local = context.local;
        const other = context.other;
        // Narrow once up front; direct indexing in the loop avoids a per-key
        // Array.isArray on the hot path.
        const localObj = toJsonObjectOrEmpty(local);
        const otherObj = toJsonObjectOrEmpty(other);
        const ancestorObj = ancestor === undefined ? undefined : toJsonObjectOrEmpty(ancestor);
        const props = mergePropertyOrder(ancestor, local, other);
        const results = [];
        for (const key of props) {
            const childNode = context.nodeFactory.createNode(ancestorObj === undefined ? undefined : ancestorObj[key], localObj[key], otherObj[key], key);
            const childResult = childNode.merge(context.config);
            results.push(childResult);
        }
        const result = combineResults(results);
        if (context.rootKey) {
            return wrapWithRootKey(result, context.rootKey.name);
        }
        return result;
    }
}
class AbstractAncestorStrategy {
    execute(context) {
        const target = this.getTarget(context);
        const targetUnchanged = jsonEqual(context.ancestor, target);
        if (context.rootKey) {
            return this.executeWithRootKey(context, context.rootKey, target, targetUnchanged);
        }
        return this.executeWithoutRootKey(context, target, targetUnchanged);
    }
    executeWithRootKey(context, rootKey, target, targetUnchanged) {
        const { name } = rootKey;
        const existsInSecondary = this.getExistsInSecondary(rootKey);
        if (!existsInSecondary && targetUnchanged) {
            return noConflict([]);
        }
        if (!existsInSecondary) {
            const targetObj = { [name]: target };
            const ancestorObj = {
                [name]: context.ancestor,
            };
            return withConflict(this.buildConflict(context, targetObj, ancestorObj));
        }
        return wrapWithRootKey(this.executeNested(context), name);
    }
    executeWithoutRootKey(context, target, targetUnchanged) {
        if (targetUnchanged) {
            return noConflict([]);
        }
        if (context.attribute) {
            return this.executeWithAttribute(context, context.attribute);
        }
        return withConflict(this.buildConflict(context, target, context.ancestor));
    }
    executeNested(context) {
        const orchestrator = new MergeOrchestrator(context.config, context.nodeFactory);
        return orchestrator.merge(context.ancestor, context.local, context.other);
    }
    executeWithAttribute(context, attribute) {
        const orchestrator = new MergeOrchestrator(context.config, context.nodeFactory);
        const targetResult = this.mergeTarget(orchestrator, context);
        const ancestorResult = orchestrator.merge({}, context.ancestor, {}, undefined);
        const targetProp = { [attribute]: targetResult.output };
        const ancestorProp = { [attribute]: ancestorResult.output };
        return withConflict(this.buildConflict(context, targetProp, ancestorProp));
    }
}
// ============================================================================
// Concrete Strategy Classes
// ============================================================================
class NoneStrategy {
    execute(_context) {
        return noConflict([]);
    }
}
class OtherOnlyStrategy {
    execute(context) {
        return buildEarlyResult(context.other, context.rootKey?.name);
    }
}
class LocalOnlyStrategy {
    execute(context) {
        return buildEarlyResult(context.local, context.rootKey?.name);
    }
}
class LocalAndOtherStrategy extends AbstractMergeStrategy {
    execute(context) {
        const local = context.local;
        const other = context.other;
        if (jsonEqual(local, other)) {
            return buildEarlyResult(local, context.rootKey?.name);
        }
        return this.mergeChildren(context, undefined);
    }
}
class AncestorOnlyStrategy {
    execute(context) {
        if (context.rootKey) {
            const { name, existsInLocal, existsInOther } = context.rootKey;
            if (existsInLocal || existsInOther) {
                return noConflict([{ [name]: [] }]);
            }
            return noConflict([]);
        }
        return noConflict([]);
    }
}
class AncestorAndLocalStrategy extends AbstractAncestorStrategy {
    getTarget(context) {
        return context.local;
    }
    getExistsInSecondary(rootKey) {
        return rootKey.existsInOther;
    }
    buildConflict(_context, targetObj, ancestorObj) {
        return [buildConflictMarkers(targetObj, ancestorObj, {})];
    }
    mergeTarget(orchestrator, context) {
        return orchestrator.merge({}, context.local, {}, undefined);
    }
}
class AncestorAndOtherStrategy extends AbstractAncestorStrategy {
    getTarget(context) {
        return context.other;
    }
    getExistsInSecondary(rootKey) {
        return rootKey.existsInLocal;
    }
    buildConflict(_context, targetObj, ancestorObj) {
        return [buildConflictMarkers({}, ancestorObj, targetObj)];
    }
    mergeTarget(orchestrator, context) {
        return orchestrator.merge({}, {}, context.other, undefined);
    }
}
class AllPresentStrategy extends AbstractMergeStrategy {
    execute(context) {
        if (jsonEqual(context.ancestor, context.local) &&
            jsonEqual(context.local, context.other)) {
            return buildEarlyResult(context.local, context.rootKey?.name);
        }
        return this.mergeChildren(context, context.ancestor);
    }
}
// ============================================================================
// Strategy Factory
// ============================================================================
const strategies = {
    [MergeScenario.ALL]: new AllPresentStrategy(),
    [MergeScenario.ANCESTOR_AND_LOCAL]: new AncestorAndLocalStrategy(),
    [MergeScenario.ANCESTOR_AND_OTHER]: new AncestorAndOtherStrategy(),
    [MergeScenario.ANCESTOR_ONLY]: new AncestorOnlyStrategy(),
    [MergeScenario.LOCAL_AND_OTHER]: new LocalAndOtherStrategy(),
    [MergeScenario.LOCAL_ONLY]: new LocalOnlyStrategy(),
    [MergeScenario.NONE]: new NoneStrategy(),
    [MergeScenario.OTHER_ONLY]: new OtherOnlyStrategy(),
};
export const getScenarioStrategy = (scenario) => strategies[scenario];
//# sourceMappingURL=ScenarioStrategy.js.map