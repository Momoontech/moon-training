import { pointToSegmentDistance } from './pointToSegmentDistance.js';
import { segmentsIntersect } from './segmentsIntersect.js';

/**
 * Minimum Euclidean distance between two finite 2D line segments. Returns 0
 * when the segments intersect (including touching at a single point).
 *
 * Non-intersecting segments can't have an interior minimum, so the shortest
 * distance is always realised at one of the four endpoint-to-segment pairings.
 */
function segmentToSegmentDistance(a1, a2, b1, b2) {
    if (segmentsIntersect(a1, a2, b1, b2))
        return 0;
    const d1 = pointToSegmentDistance(a1, b1, b2);
    const d2 = pointToSegmentDistance(a2, b1, b2);
    const d3 = pointToSegmentDistance(b1, a1, a2);
    const d4 = pointToSegmentDistance(b2, a1, a2);
    return Math.min(d1, d2, d3, d4);
}

export { segmentToSegmentDistance };
