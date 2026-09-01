import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
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
import getRoomBySegment from '../../../helpers/getRoomBySegment.js';
import getNode from './getNode.js';
import getRoom from './getRoom.js';

/**
 * Resolves the owning Room for any node id by walking up the parent chain.
 *
 * Accepts:
 * - a Room id (returned as-is),
 * - a RoomSegment id (resolved via `getRoomBySegment`, since segments are
 *   parented to a Stage rather than directly to their Room),
 * - any descendant node id (Wall2D, MountPlane, Item, etc.) — the walk
 *   stops at the first Room (or RoomSegment) ancestor.
 *
 * Throws if no Room can be reached from the given node.
 */
const getParentRoom = (core, nodeId) => {
    let node = getNode(core, nodeId);
    while (node) {
        if (node.type === NodeType.Room)
            return node;
        if (node.type === NodeType.RoomSegment) {
            return getRoom(core, getRoomBySegment(core, node.id));
        }
        const parentId = node.parent.get();
        if (!parentId)
            break;
        node = getNode(core, parentId);
    }
    throw new Error(`Room with nodeId ${nodeId} not found`);
};

export { getParentRoom as default };
