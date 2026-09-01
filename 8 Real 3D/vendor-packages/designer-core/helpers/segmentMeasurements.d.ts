import { RoomSegment } from '../components/Node/components/RoomSegment';
import { Command } from '../components/commands/core/Command';
import { CoreDesigner } from '../designer-core';
/**
 * Compute the length of a room segment (distance between its two endpoints).
 */
export declare const computeSegmentLength: (core: CoreDesigner, segment: RoomSegment) => number;
/**
 * Wall axis vectors computed from a segment's endpoints.
 * widthAxis runs along the wall, depthAxis runs perpendicular into the room.
 */
export interface WallAxes {
    widthAxis: {
        x: number;
        z: number;
    };
    depthAxis: {
        x: number;
        z: number;
    };
}
export interface WallInfo {
    wallAxes: WallAxes;
    wallLength: number;
}
/**
 * Compute wall direction axes and length from a segment's endpoints.
 * Returns axis-aligned defaults with Infinity length if the segment
 * cannot be resolved (e.g. node has no parent room segment).
 */
export declare const computeWallInfo: (core: CoreDesigner, segment: RoomSegment) => WallInfo;
/**
 * Create commands to resize a wall segment to a new length.
 * Scales the "from" point position relative to the fixed "to" point.
 * Returns null when the new length is invalid or the segment has zero length.
 */
export declare const setSegmentLength: (core: CoreDesigner, segment: RoomSegment, newLength: number) => Command[];
