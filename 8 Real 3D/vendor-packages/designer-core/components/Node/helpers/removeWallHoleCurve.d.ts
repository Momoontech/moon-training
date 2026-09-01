import type { Node } from '../../Node';
/**
 * Removes `node.id` from the `holes` map of every Wall2D on the current stage.
 *
 * Called from SetNodeParentCommand (before and after reparenting) and from
 * disposeNode. Walking all walls is necessary because the self-healing effect
 * may have written hole entries on both the front wall and a back wall — and
 * since no back-wall id is stored on the Item, we must scan all walls rather
 * than rely on stored bookkeeping.
 */
declare const removeWallHoleCurve: (node: Node) => void;
export default removeWallHoleCurve;
