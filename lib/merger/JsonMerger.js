import { __decorate } from "tslib";
import { toJsonObjectOrEmpty, } from '../types/jsonTypes.js';
import { combineResults } from '../types/mergeResult.js';
import { log } from '../utils/LoggingDecorator.js';
import { MergeOrchestrator } from './MergeOrchestrator.js';
import { mergePropertyOrder } from './mergePropertyOrder.js';
import { defaultNodeFactory } from './nodes/MergeNodeFactory.js';
// `obj[key]` also walks the prototype chain (e.g. `{}['constructor']`
// resolves to the inherited Object constructor) — key is an untrusted
// XML tag name, so an own-property guard is needed here too, not just
// on the `in` check below.
const getOwnProperty = (obj, key) => Object.hasOwn(obj, key) ? obj[key] : undefined;
export class JsonMerger {
    orchestrator;
    constructor(config) {
        this.orchestrator = new MergeOrchestrator(config, defaultNodeFactory);
    }
    mergeThreeWay(ancestor, local, other) {
        // Narrow once up front so the per-key loop can index directly without
        // paying for Array.isArray on every property access (hot path —
        // observed >20% cost on ordered-merge benches).
        const ancestorObj = toJsonObjectOrEmpty(ancestor);
        const localObj = toJsonObjectOrEmpty(local);
        const otherObj = toJsonObjectOrEmpty(other);
        const results = [];
        const props = mergePropertyOrder(ancestor, local, other);
        for (const key of props) {
            const result = this.orchestrator.merge(getOwnProperty(ancestorObj, key), getOwnProperty(localObj, key), getOwnProperty(otherObj, key), undefined, {
                name: key,
                existsInLocal: Object.hasOwn(localObj, key),
                existsInOther: Object.hasOwn(otherObj, key),
            });
            results.push(result);
        }
        const combined = combineResults(results);
        return {
            output: combined.output,
            hasConflict: combined.hasConflict,
        };
    }
}
__decorate([
    log('JsonMerger')
], JsonMerger.prototype, "mergeThreeWay", null);
//# sourceMappingURL=JsonMerger.js.map