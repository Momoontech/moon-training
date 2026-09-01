import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
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
declare const getParentRoom: (core: CoreDesigner, nodeId: UUID | undefined) => import("..").Room;
export default getParentRoom;
