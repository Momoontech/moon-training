/**
 * Wraps a per-Node reactive effect with a guard that skips execution when the
 * node has already been unregistered from `core.nodes`.
 *
 * Why this is needed:
 * `packExecute` wraps command execution in a Preact `batch()`, so signal writes
 * inside a transaction are coalesced and effects only flush when the batch
 * exits. During mass removals (e.g. `core.dispose()`, or cascading child
 * disposal in `RemoveNodeCommand`) a node may be unregistered *before* the
 * flush runs its already-dirty effect. Those effects frequently read
 * `getNode(core, id)` / `getParentItem(node)` etc., which throw if the node
 * is gone. Bailing early is safe — the node is disposed, nothing to update.
 */
const registerNodeEffect = (node, callback) => node.core.registerEffect(() => {
    if (!node.core.nodes.has(node.id))
        return undefined;
    return callback(node);
});
const registerNodeEffects = (node) => {
    const disposeFns = [];
    if ('effects' in node) {
        for (const callback of node.effects) {
            disposeFns.push(registerNodeEffect(node, callback));
        }
    }
    else {
        throw new Error('Node does not have an effects property');
    }
    return () => {
        for (const disposeFn of disposeFns) {
            disposeFn();
        }
    };
};

export { registerNodeEffect, registerNodeEffects };
