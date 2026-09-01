import { UUID } from '../declarations';
import { CoreDesigner } from '../designer-core';
/**
 * Returns every room on the current stage whose polygon walks through the
 * given point id. Rooms are detected by scanning each room's `path` (segment
 * ids) and checking whether any segment references `pointId` as its `from`
 * or `to` endpoint.
 *
 * Used when dragging an existing corner: the dragged point's own rooms must
 * be excluded from collision tests — otherwise the point's own polygon would
 * immediately reject every candidate position.
 */
declare const getRoomsByPoint: (core: CoreDesigner, pointId: UUID) => UUID[];
export default getRoomsByPoint;
