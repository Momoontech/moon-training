import { UUID } from '../declarations';
import { CoreDesigner } from '../designer-core';
import { Vector2 } from './math/Vector2';
/**
 * Builds the ordered 2D polygon of a room by walking its segment path
 * (Room.path -> RoomSegment.from -> Point.position).
 *
 * Room segments are stored with a consistent `from` -> `to` orientation
 * (normalized by `normilezeSegmentsClosePath` when the room is created), so
 * pushing `from` of each segment in path order yields the full closed polygon.
 */
declare const getRoomPolygon: (core: CoreDesigner, roomId: UUID) => Vector2[];
export default getRoomPolygon;
