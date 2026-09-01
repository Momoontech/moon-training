import { Vector2 } from '../Vector2';
/**
 * Euclidean distance from a 2D point to the closest point on a finite line
 * segment a→b. If a and b coincide, returns the plain point-to-point distance.
 */
export declare function pointToSegmentDistance(p: Vector2, a: Vector2, b: Vector2): number;
