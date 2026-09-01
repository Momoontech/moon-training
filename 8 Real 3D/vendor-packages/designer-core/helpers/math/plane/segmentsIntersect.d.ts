import { Vector2 } from '../Vector2';
/**
 * Tests whether two 2D line segments (a1→a2 and b1→b2) intersect.
 *
 * Uses the standard cross-product parametric form:
 *   p = a1 + t*(a2 - a1), p = b1 + u*(b2 - b1)
 * The segments intersect when a unique (t, u) exists within [0, 1] × [0, 1].
 * Parallel or collinear segments (|cross| ≈ 0) are reported as non-intersecting —
 * collinear overlap is handled separately by `getCollinearSegmentsOverlap`.
 */
export declare function segmentsIntersect(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): boolean;
