import { getScenario } from './MergeScenarioFactory.js';
import { defaultNodeFactory, } from './nodes/MergeNodeFactory.js';
import { getScenarioStrategy } from './strategies/ScenarioStrategy.js';
export class MergeOrchestrator {
    config;
    nodeFactory;
    constructor(config, nodeFactory = defaultNodeFactory) {
        this.config = config;
        this.nodeFactory = nodeFactory;
    }
    merge(ancestor, local, other, attribute, rootKey) {
        const scenario = getScenario(ancestor, local, other);
        const strategy = getScenarioStrategy(scenario);
        const context = {
            config: this.config,
            ancestor,
            local,
            other,
            attribute,
            nodeFactory: this.nodeFactory,
            rootKey,
        };
        return strategy.execute(context);
    }
}
//# sourceMappingURL=MergeOrchestrator.js.map