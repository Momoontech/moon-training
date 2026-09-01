import { Vector2 } from '../Vector2';
/**
 * Projects a point onto a line segment
 * Returns the projected point and parameter t (0-1) along the segment
 */
export declare function projectPointToSegment(point: Vector2, segFrom: Vector2, segTo: Vector2): {
    projectedPoint: Vector2;
    t: number;
};
