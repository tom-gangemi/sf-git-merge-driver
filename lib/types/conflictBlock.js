export const isConflictBlock = (value) => typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    '__conflict' in value &&
    value.__conflict === true;
export const buildConflictBlock = (local, ancestor, other) => ({
    __conflict: true,
    local: Array.isArray(local) ? local : [local],
    ancestor: Array.isArray(ancestor) ? ancestor : [ancestor],
    other: Array.isArray(other) ? other : [other],
});
//# sourceMappingURL=conflictBlock.js.map