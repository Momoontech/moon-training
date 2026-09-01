import { Vector2 } from './math/Vector2.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

/**
 * Offsets a closed 2D polygon outward by a constant thickness using miter joins
 * @param points - Array of Vector2 representing a closed path (last point connects to first)
 * @param thickness - Offset distance (positive = outward, negative = inward)
 * @param miterLimit - Maximum miter length ratio (prevents very long spikes, default: 2.0)
 * @returns Offset polygon as Vector2 array
 */
function offsetPolygon(points, thickness, miterLimit = 2.0) {
    if (points.length < 3) {
        throw new Error('Polygon must have at least 3 points');
    }
    const result = [];
    const n = points.length;
    // Determine if polygon is clockwise or counter-clockwise
    const signedArea = calculateSignedArea(points);
    const isClockwise = signedArea < 0;
    // For outward offset, we need normals pointing away from the polygon
    // CCW polygons: left perpendicular (90° CCW) points outward
    // CW polygons: right perpendicular (90° CW) points outward
    const normalSign = isClockwise ? -1 : 1;
    for (let i = 0; i < n; i++) {
        const prevIdx = (i - 1 + n) % n;
        const currIdx = i;
        const nextIdx = (i + 1) % n;
        const p0 = points[prevIdx];
        const p1 = points[currIdx];
        const p2 = points[nextIdx];
        // Calculate edges
        const edge1 = new Vector2().subVectors(p1, p0);
        const edge2 = new Vector2().subVectors(p2, p1);
        // Calculate perpendicular normals
        // Left perpendicular (90° CCW rotation): (-y, x)
        const normal1 = new Vector2(-edge1.y, edge1.x).normalize();
        const normal2 = new Vector2(-edge2.y, edge2.x).normalize();
        // Apply winding order correction and thickness
        const offset1 = new Vector2().copy(normal1).multiplyScalar(normalSign * thickness);
        const offset2 = new Vector2().copy(normal2).multiplyScalar(normalSign * thickness);
        // Calculate offset edge endpoints
        const offsetEdge1Start = new Vector2().addVectors(p0, offset1);
        const offsetEdge1End = new Vector2().addVectors(p1, offset1);
        const offsetEdge2Start = new Vector2().addVectors(p1, offset2);
        const offsetEdge2End = new Vector2().addVectors(p2, offset2);
        // Find intersection of the two offset edges (miter join)
        const intersection = lineLineIntersection(offsetEdge1Start, offsetEdge1End, offsetEdge2Start, offsetEdge2End);
        if (intersection) {
            // Check miter limit
            const miterLength = intersection.distanceTo(p1);
            const maxMiterLength = Math.abs(thickness) * miterLimit;
            if (miterLength <= maxMiterLength) {
                // Use miter point
                result.push(intersection);
            }
            else {
                // Miter too long, fall back to bevel (add both edge endpoints)
                result.push(offsetEdge1End);
                if (offsetEdge1End.distanceToSquared(offsetEdge2Start) > 1e-6) {
                    result.push(offsetEdge2Start);
                }
            }
        }
        else {
            // Parallel edges or no intersection, use bevel
            result.push(offsetEdge1End);
            if (offsetEdge1End.distanceToSquared(offsetEdge2Start) > 1e-6) {
                result.push(offsetEdge2Start);
            }
        }
    }
    return result;
}
/**
 * Calculate signed area of polygon (positive = counter-clockwise, negative = clockwise)
 */
function calculateSignedArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return area / 2;
}
/**
 * Find intersection point of two lines (defined by two points each)
 * Returns null if lines are parallel or don't intersect
 */
function lineLineIntersection(p1, p2, p3, p4) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    // Lines are parallel
    if (Math.abs(denom) < 1e-10) {
        return null;
    }
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    return new Vector2(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}

export { offsetPolygon };
