import { Vector2 } from '../Vector2.js';

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
function segmentsIntersection(a1, a2, b1, b2) {
    const d1x = a2.x - a1.x;
    const d1y = a2.y - a1.y;
    const d2x = b2.x - b1.x;
    const d2y = b2.y - b1.y;
    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 1e-10)
        return null;
    const dx = b1.x - a1.x;
    const dy = b1.y - a1.y;
    const t = (dx * d2y - dy * d2x) / cross;
    const u = (dx * d1y - dy * d1x) / cross;
    if (t < 0 || t > 1 || u < 0 || u > 1)
        return null;
    const v = new Vector2(a1.x + t * d1x, a1.y + t * d1y);
    return { v, t, u };
}

export { segmentsIntersection };
