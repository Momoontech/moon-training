import { Node } from '..';
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
export declare const registerNodeEffect: (node: Node, callback: (node: Node) => void) => () => void;
export declare const registerNodeEffects: (node: Node) => () => void;
