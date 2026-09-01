import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
/**
 * Resolve the multiCloset system a node belongs to and return its system id.
 *
 * Derived from {@link getParentByCondition}: walks up from `nodeId` to the
 * enclosing multiCloset Item (so a section/part resolves to its closet) and
 * reads its `system` reference. Returns `undefined` when the node is not part of
 * a multiCloset, or its multiCloset has not been assigned to a system.
 *
 * Pair with {@link getNodesBySystem} to expand an id into all closets of its
 * system (e.g. the Customize-step whole-system outline).
 */
declare const getSystemById: (core: CoreDesigner, nodeId: UUID) => UUID | undefined;
export default getSystemById;
