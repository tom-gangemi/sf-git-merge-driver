export const setsEqual = (a, b) => {
    if (a.size !== b.size)
        return false;
    for (const item of a) {
        if (!b.has(item))
            return false;
    }
    return true;
};
export const setsIntersect = (a, b) => {
    for (const item of a) {
        if (b.has(item))
            return true;
    }
    return false;
};
//# sourceMappingURL=setUtils.js.map