import { Vector2 } from './Vector2';
/**
 * Determines if a sequence of points forms a counterclockwise (CCW) path on a plane.
 * Uses the signed area calculation (shoelace formula).
 *
 * @param points - Array of Vector2 points forming a closed polygon
 * @returns true if the path is counterclockwise, false if clockwise
 */
export declare function isCCW(points: Vector2[]): boolean;
