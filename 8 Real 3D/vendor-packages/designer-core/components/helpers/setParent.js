import { childrenProperties } from '../Node/helpers/childrenProperties.js';

function setParent(oldParent, node, newParent, childProperty, insertIndex) {
    // 1. Remove ourselves from old parent's `children`
    if (oldParent) {
        for (let i = 0; i < childrenProperties.length; i += 1) {
            if (childrenProperties[i] in oldParent) {
                oldParent[childrenProperties[i]].set(oldParent[childrenProperties[i]].get().filter((child) => child !== node.id));
            }
        }
    }
    // 2. Add ourselves to new parent's `children`
    // Make sure we're not in the list before adding
    if (childProperty in newParent === false)
        throw new Error(`Cannot set parent to ${newParent}  - it does not have children property`);
    const siblings = newParent[childProperty].get();
    if (Array.isArray(siblings)) {
        const without = siblings.filter((id) => id !== node.id);
        // console.log('without', without, siblings);
        if (without.length === siblings.length) {
            const at = insertIndex === undefined ? without.length : Math.max(0, Math.min(insertIndex, without.length));
            // console.log(at, [...without.slice(0, at), node.id, ...without.slice(at)]);
            newParent[childProperty].set([...without.slice(0, at), node.id, ...without.slice(at)]);
        }
    }
    else if (siblings !== node.id) {
        newParent[childProperty].set(node.id);
    }
    // 3. Update our own `parent` signal
    node.parent.set(newParent.id);
}

export { setParent as default };
