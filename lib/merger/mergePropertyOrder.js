import { toJsonObjectOrEmpty, } from '../types/jsonTypes.js';
const keysOf = (value) => value == null ? [] : Object.keys(toJsonObjectOrEmpty(value));
const sameSequence = (left, right) => {
    if (left.length !== right.length)
        return false;
    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i])
            return false;
    }
    return true;
};
const isSubsequence = (sub, full) => {
    let matched = 0;
    for (const key of full) {
        if (matched < sub.length && key === sub[matched])
            matched++;
    }
    return matched === sub.length;
};
const indexKeys = (lists) => {
    const unique = new Set();
    for (const list of lists)
        for (const key of list)
            unique.add(key);
    const keys = [...unique].sort();
    const index = new Map();
    for (let i = 0; i < keys.length; i++)
        index.set(keys[i], i);
    return { keys, index };
};
const buildEdges = (lists, index, size) => {
    const indegree = new Int32Array(size);
    const successors = Array.from({ length: size }, () => []);
    for (const list of lists) {
        for (let i = 1; i < list.length; i++) {
            const from = index.get(list[i - 1]);
            const to = index.get(list[i]);
            successors[from].push(to);
            indegree[to]++;
        }
    }
    return { indegree, successors };
};
// When no unemitted key has indegree 0 (a cycle), the repair must not
// reach past the cycle into keys every side already agreed on: it picks
// among unemitted keys with the lowest residual indegree, tie-broken by
// rank (lowest index) via the ascending scan order.
const nextIndex = (size, emitted, indegree) => {
    let best = -1;
    for (let i = 0; i < size; i++) {
        if (emitted[i])
            continue;
        if (indegree[i] === 0)
            return i;
        if (best === -1 || indegree[i] < indegree[best])
            best = i;
    }
    return best;
};
const topologicalOrder = (keys, indegree, successors) => {
    const size = keys.length;
    const emitted = new Uint8Array(size);
    const order = [];
    for (let step = 0; step < size; step++) {
        const chosen = nextIndex(size, emitted, indegree);
        emitted[chosen] = 1;
        order.push(keys[chosen]);
        for (const successor of successors[chosen])
            indegree[successor]--;
    }
    return order;
};
export const mergePropertyOrder = (ancestor, local, other) => {
    const ancestorKeys = keysOf(ancestor);
    const localKeys = keysOf(local);
    const otherKeys = keysOf(other);
    if (sameSequence(localKeys, otherKeys) &&
        isSubsequence(ancestorKeys, localKeys)) {
        return localKeys;
    }
    const lists = [ancestorKeys, localKeys, otherKeys];
    const { keys, index } = indexKeys(lists);
    const { indegree, successors } = buildEdges(lists, index, keys.length);
    return topologicalOrder(keys, indegree, successors);
};
//# sourceMappingURL=mergePropertyOrder.js.map