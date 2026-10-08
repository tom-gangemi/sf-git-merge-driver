import { getScalarScenario } from '../MergeScenarioFactory.js';
import { getTextMergeStrategy } from '../strategies/TextMergeStrategy.js';
export class TextMergeNode {
    ancestor;
    local;
    other;
    attribute;
    constructor(
    // `null` is already in JsonValue; `undefined` distinguishes the
    // "key not present on this side" case propagated from JsonMerger/
    // ScenarioStrategy via getJsonProp/toJsonObjectOrEmpty + direct indexing.
    ancestor, local, other, attribute) {
        this.ancestor = ancestor;
        this.local = local;
        this.other = other;
        this.attribute = attribute;
    }
    merge(config) {
        const scenario = getScalarScenario(this.ancestor, this.local, this.other);
        const strategy = getTextMergeStrategy(scenario);
        return strategy.handle({
            config,
            attribute: this.attribute,
            ancestor: this.ancestor,
            local: this.local,
            other: this.other,
        });
    }
}
//# sourceMappingURL=TextMergeNode.js.map