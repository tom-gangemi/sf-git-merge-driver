/** biome-ignore-all lint/suspicious/noExplicitAny: it is dynamic by definition */
import { isLevelEnabled, LOG_LEVELS, Logger, lazy } from './LoggingService.js';
// Resolved at module init. When the trace threshold is above LEVELS.trace the
// decorator leaves methods untouched — avoiding closure + tagged-template
// allocations per call in the hot path of the merge pipeline.
const TRACE_ENABLED = isLevelEnabled(LOG_LEVELS.trace);
export function log(className) {
    return function (_target, propertyKey, descriptor) {
        if (!TRACE_ENABLED)
            return;
        const original = descriptor.value;
        descriptor.value = function (...args) {
            Logger.trace(lazy `${className}.${propertyKey}: entry`);
            const call = () => original.call(this, ...args);
            if (original.constructor.name === 'AsyncFunction') {
                return call().then((result) => {
                    Logger.trace(lazy `${className}.${propertyKey}: exit`);
                    return result;
                }, (err) => {
                    Logger.trace(lazy `${className}.${propertyKey}: exit (error)`);
                    throw err;
                });
            }
            try {
                const result = call();
                Logger.trace(lazy `${className}.${propertyKey}: exit`);
                return result;
            }
            catch (err) {
                Logger.trace(lazy `${className}.${propertyKey}: exit (error)`);
                throw err;
            }
        };
    };
}
//# sourceMappingURL=LoggingDecorator.js.map