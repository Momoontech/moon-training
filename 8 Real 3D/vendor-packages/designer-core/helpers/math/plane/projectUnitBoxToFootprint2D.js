import { Vector3 } from '../Vector3.js';
import { UNIT_BOX_CORNERS } from './unitBoxCorners.js';

// Module-level scratch for the projection pass. The hull itself allocates
// fresh points (callers keep them past the next call), but the 8 intermediate
// projections never escape.
const _corner = new Vector3();
const _projected = Array.from({ length: 8 }, () => ({ x: 0, z: 0 }));
const compareXThenZ = (a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x);
/** 2D cross product of (a − o) × (b − o) on the (X, Z) plane. */
const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
/**
 * Convex hull (Andrew's monotone chain) of a small point set on the (X, Z)
 * plane. Collinear points are dropped (`<= 0` pop), so a box footprint comes
 * back as exactly 4 vertices. Returns fresh point objects — never aliases the
 * input.
 *
 * Degenerate input (every point collinear or coincident) yields **at most 2
 * points**, and that is the contract callers rely on to detect "no usable
 * footprint" and fall back to an AABB — a 2-point result must never be padded
 * back out to the input set, or a zero-area object would be hit-tested as a
 * solid outline.
 */
const convexHull2D = (points) => {
    const sorted = points.slice().sort(compareXThenZ);
    if (sorted.length < 3)
        return sorted.map((p) => ({ x: p.x, z: p.z }));
    const lower = [];
    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
            lower.pop();
        lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
            upper.pop();
        upper.push(p);
    }
    // Drop each chain's last point — it is the other chain's first.
    lower.pop();
    upper.pop();
    // Collinear input collapses both chains to a single point each, so the hull
    // comes back with 2 points (or 0 for coincident input). That short result IS
    // the "degenerate, no usable footprint" signal callers test for — never pad
    // it back out to the input set, which would look like a valid polygon and be
    // hit-tested as a solid outline.
    return lower.concat(upper).map((p) => ({ x: p.x, z: p.z }));
};
/**
 * Project the 8 unit-cube corners through `source × target` (apply `source`
 * first, then `target`) and return the convex footprint of the result on the
 * target frame's (X, Z) plane.
 *
 * Same inputs as {@link projectUnitBoxToBox3}, different output: the TRUE
 * footprint polygon instead of its axis-aligned bounding box. For a node
 * rotated relative to the target frame the two differ enormously — a 96" × 24"
 * closet at 45° has an ~85" × 85" AABB, more than three times its real
 * footprint area — so any "what blocks this ray" test fed the AABB reports
 * phantom obstructions in the empty corners of that box.
 *
 * The footprint is a rectangle for every rotation the app produces today (all
 * items rotate about the vertical axis only), but the hull is computed
 * generally so an arbitrarily-oriented node degrades to a correct hexagon
 * rather than a silently wrong quad.
 *
 * Used by `itemClearances.ts::collectPlanarItemBlockers` to give
 * `raycastClearances2D` real blocker outlines.
 */
const projectUnitBoxToFootprint2D = (source, target) => {
    for (let i = 0; i < 8; i++) {
        _corner.copy(UNIT_BOX_CORNERS[i]).applyMatrix4(source).applyMatrix4(target);
        _projected[i].x = _corner.x;
        _projected[i].z = _corner.z;
    }
    return convexHull2D(_projected);
};

export { convexHull2D, projectUnitBoxToFootprint2D };
