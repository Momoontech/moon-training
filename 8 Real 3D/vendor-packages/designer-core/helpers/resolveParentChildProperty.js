import { childrenProperties, singleChildProperties } from '../components/Node/helpers/childrenProperties.js';
import getNode from '../components/Node/helpers/getNode.js';

/**
 * Finds which property on the parent holds `nodeId`, using the same rules as
 * `removeNodeRecursive` in CreateNodeCommand (children list scan, then single-child scan).
 */
function resolveParentChildProperty(core, nodeId) {
    const node = getNode(core, nodeId);
    const parentId = node.parent.get();
    const parent = getNode(core, parentId);
    let childProperty = null;
    for (let i = childrenProperties.length - 1; i >= 0; i -= 1) {
        const property = childrenProperties[i];
        if (property in parent) {
            const list = parent[property].get();
            if (list?.includes(nodeId)) {
                childProperty = property;
            }
        }
    }
    for (let i = singleChildProperties.length - 1; i >= 0; i -= 1) {
        const property = singleChildProperties[i];
        if (property in parent) {
            const single = parent[property].get();
            if (single === nodeId) {
                childProperty = property;
            }
        }
    }
    if (!childProperty) {
        throw new Error('Failed to resolve parent child property');
    }
    let index;
    if (singleChildProperties.includes(childProperty)) {
        index = undefined;
    }
    else {
        const list = parent[childProperty].get();
        if (Array.isArray(list)) {
            const idx = list.indexOf(nodeId);
            if (idx >= 0) {
                index = idx;
            }
        }
    }
    return { parentId, childProperty, index };
}

export { resolveParentChildProperty };
