import { Vector2 } from '../Vector2';
/**
 * Returns the intersection of two finite 2D line segments (a1→a2 and b1→b2).
 *
 * Uses the standard cross-product parametric form:
 *   p = a1 + t * (a2 - a1), p = b1 + u * (b2 - b1)
 * The segments intersect when a unique (t, u) exists within [0, 1] × [0, 1].
 * Parallel or collinear segments (|cross| ≈ 0) are reported as non-intersecting —
 * collinear overlap is handled separately by `getCollinearSegmentsOverlap`.
 *
 * Sibling of `segmentsIntersect`; this variant additionally returns the
 * intersection point and both parameters so callers can derive distances or
 * pick the closest hit when sweeping multiple candidates.
 */
export declare function segmentsIntersection(a1: Vector2, a2: Vector2, b1: Vector2, b2: Vector2): {
    v: Vector2;
    t: number;
    u: number;
} | null;
