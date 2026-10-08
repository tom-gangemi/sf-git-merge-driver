import { buildConflictBlock, } from '../types/conflictBlock.js';
const hasNoContent = (x) => Array.isArray(x) ? x.length === 0 : Object.keys(x).length === 0;
export const buildConflictMarkers = (local, ancestor, other) => {
    const localValue = hasNoContent(local) ? {} : local;
    const ancestorValue = hasNoContent(ancestor) ? {} : ancestor;
    const otherValue = hasNoContent(other) ? {} : other;
    return buildConflictBlock(localValue, ancestorValue, otherValue);
};
//# sourceMappingURL=ConflictMarkerBuilder.js.map