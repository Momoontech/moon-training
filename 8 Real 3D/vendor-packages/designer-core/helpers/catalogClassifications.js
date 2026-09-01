/** Label → matching category IDs (case-insensitive). */
const findClassificationIdsByLabel = (classifications, label) => {
    const target = label.toLowerCase();
    return Object.entries(classifications)
        .filter(([, cat]) => cat.label.toLowerCase() === target)
        .map(([id]) => id);
};
/** Build a parent → children lookup map from flat categories. O(n) once. */
const buildChildrenMap = (classifications) => {
    const map = new Map();
    for (const [id, cat] of Object.entries(classifications)) {
        if (cat.parent != null) {
            const siblings = map.get(cat.parent);
            if (siblings)
                siblings.push(id);
            else
                map.set(cat.parent, [id]);
        }
    }
    return map;
};
/** BFS from rootIds using a pre-built children map. Returns all descendant IDs (including roots). */
const getDescendantIds = (rootIds, childrenOf) => {
    const result = [];
    const queue = [...rootIds];
    while (queue.length) {
        const id = queue.pop();
        result.push(id);
        const children = childrenOf.get(id);
        if (children)
            queue.push(...children);
    }
    return result;
};

export { buildChildrenMap, findClassificationIdsByLabel, getDescendantIds };
