import { ArcRoomSegment } from './ArcRoomSegment';
import { BezierRoomSegment } from './BezierRoomSegment';
import { LinearRoomSegment } from './LinearRoomSegment';
export type RoomSegment = LinearRoomSegment | ArcRoomSegment | BezierRoomSegment;
