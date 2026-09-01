import { Vector2 } from '../Vector2';
/**
 * Minimum Euclidean distance between two finite 2D line segments. Returns 0
 * when the segments intersect (including touching at a single point).
 *
 * Non-intersecting segments can't have an interior minimum, so the shortest
 * distance is always realised at one of the four endpoint-to-segment pairings.
 */
export declare function segmentToSegmentDistance(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): number;
