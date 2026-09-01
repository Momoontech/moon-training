/**
 * Tests whether two 2D line segments (a1→a2 and b1→b2) intersect.
 *
 * Uses the standard cross-product parametric form:
 *   p = a1 + t*(a2 - a1), p = b1 + u*(b2 - b1)
 * The segments intersect when a unique (t, u) exists within [0, 1] × [0, 1].
 * Parallel or collinear segments (|cross| ≈ 0) are reported as non-intersecting —
 * collinear overlap is handled separately by `getCollinearSegmentsOverlap`.
 */
function segmentsIntersect(a1, a2, b1, b2) {
    const d1x = a2.x - a1.x;
    const d1y = a2.y - a1.y;
    const d2x = b2.x - b1.x;
    const d2y = b2.y - b1.y;
    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 1e-10)
        return false;
    const dx = b1.x - a1.x;
    const dy = b1.y - a1.y;
    const t = (dx * d2y - dy * d2x) / cross;
    const u = (dx * d1y - dy * d1x) / cross;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export { segmentsIntersect };
