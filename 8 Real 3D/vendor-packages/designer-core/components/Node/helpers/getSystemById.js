import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import getParentByCondition from './getParentByCondition.js';

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
const getSystemById = (core, nodeId) => {
    const closet = getParentByCondition(core, nodeId, (node) => node.type === NodeType.Item && node.itemType.get() === ItemType.multiCloset);
    return closet && closet.type === NodeType.Item ? closet.system?.get() : undefined;
};

export { getSystemById as default };
