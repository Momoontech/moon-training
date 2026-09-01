import { childrenProperties, singleChildProperties } from './childrenProperties.js';
import getNode from './getNode.js';

/**
 * Recursively snapshot a node and all its descendants without modifying the scene.
 * Used to capture stable UUIDs so redo paths can reconstruct the exact same subtree
 * instead of generating fresh v4() ids each time (which would break any commands
 * recorded against the original ids).
 */
const snapshotNodeTree = (core, id) => {
    const node = getNode(core, id);
    const objects = { [id]: node.toJSON() };
    for (let i = childrenProperties.length - 1; i >= 0; i -= 1) {
        const prop = childrenProperties[i];
        if (prop in node) {
            const children = node[prop].get();
            if (children) {
                for (const childId of children) {
                    Object.assign(objects, snapshotNodeTree(core, childId));
                }
            }
        }
    }
    for (let i = singleChildProperties.length - 1; i >= 0; i -= 1) {
        const prop = singleChildProperties[i];
        if (prop in node) {
            const child = node[prop].get();
            if (child) {
                Object.assign(objects, snapshotNodeTree(core, child));
            }
        }
    }
    return objects;
};

export { snapshotNodeTree as default };
