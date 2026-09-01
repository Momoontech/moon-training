const unbounded = () => ({
    distance: Infinity,
    source: 'unbounded',
    blockerId: null
});
const aabbHit = (distance, blockerId) => ({
    distance: Math.max(0, distance),
    source: 'aabb',
    blockerId
});
const polygonHit = (distance) => ({
    distance: Math.max(0, distance),
    source: 'polygon',
    blockerId: null
});
/** Segment-vs-ray parallel-rejection epsilon, shared by both loop passes. */
const EPS = 1e-9;
/**
 * Even-odd point-in-polygon on the (X, Z) plane. Mirrors
 * `isPointInPolygon` (which is `Vector2`-typed) without allocating.
 */
const isInsideLoop = (x, z, loop) => {
    if (loop.length < 3)
        return false;
    let inside = false;
    for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
        const zi = loop[i].z;
        const zj = loop[j].z;
        if (zi > z !== zj > z && x < ((loop[j].x - loop[i].x) * (z - zi)) / (zj - zi) + loop[i].x) {
            inside = !inside;
        }
    }
    return inside;
};
/**
 * Nearest crossing of a closed vertex loop with each of the 4 axis-aligned
 * rays from `(centerX, centerZ)`, folded into `acc`.
 *
 * Shared by the room polygon and by blocker footprints — the math is identical,
 * only the reported `source` differs: pass `blockerId === null` for the polygon
 * (reports `'polygon'`), or the blocker's id (reports `'aabb'`).
 *
 * Perfectly parallel segments (`|dz| < EPS` for the ±X rays, `|dx| < EPS` for
 * ±Z) are skipped — they either miss the ray entirely or lie on it, in which
 * case an adjacent edge supplies the meaningful crossing.
 */
const accumulateLoopCrossings = (centerX, centerZ, loop, blockerId, acc) => {
    const n = loop.length;
    if (n < 2)
        return;
    for (let i = 0; i < n; i++) {
        const p1 = loop[i];
        const p2 = loop[(i + 1) % n];
        // ±X rays — solve for `t` where the segment crosses `z = centerZ`.
        const dz = p2.z - p1.z;
        if (Math.abs(dz) > EPS) {
            const t = (centerZ - p1.z) / dz;
            if (t >= 0 && t <= 1) {
                const xCross = p1.x + t * (p2.x - p1.x);
                if (xCross > centerX) {
                    const d = xCross - centerX;
                    if (d < acc.xPlus.distance)
                        acc.xPlus = blockerId === null ? polygonHit(d) : aabbHit(d, blockerId);
                }
                else if (xCross < centerX) {
                    const d = centerX - xCross;
                    if (d < acc.xMinus.distance)
                        acc.xMinus = blockerId === null ? polygonHit(d) : aabbHit(d, blockerId);
                }
            }
        }
        // ±Z rays — solve for `t` where the segment crosses `x = centerX`.
        const dx = p2.x - p1.x;
        if (Math.abs(dx) > EPS) {
            const t = (centerX - p1.x) / dx;
            if (t >= 0 && t <= 1) {
                const zCross = p1.z + t * (p2.z - p1.z);
                if (zCross > centerZ) {
                    const d = zCross - centerZ;
                    if (d < acc.zPlus.distance)
                        acc.zPlus = blockerId === null ? polygonHit(d) : aabbHit(d, blockerId);
                }
                else if (zCross < centerZ) {
                    const d = centerZ - zCross;
                    if (d < acc.zMinus.distance)
                        acc.zMinus = blockerId === null ? polygonHit(d) : aabbHit(d, blockerId);
                }
            }
        }
    }
};
/**
 * Pure 2D ray-cast clearance compute. Casts 4 axis-aligned rays from
 * `(centerX, centerZ)` in `±X` / `±Z` and returns the shortest hit per
 * direction across both blocker AABBs and a closed polygon.
 *
 * Per direction:
 *   - **Blocker hit**: a blocker carrying `corners` is hit-tested against
 *     its TRUE footprint (nearest boundary crossing along the ray); one
 *     without falls back to its AABB — the ray hits the AABB face
 *     perpendicular to its direction iff the perpendicular coordinate of
 *     the ray origin lies inside the AABB's perpendicular span (so the ray
 *     "tunnels through" that face). Either way, blockers containing the
 *     origin contribute no hit on either side — they overlap the cast and
 *     the dimension is meaningless. Prefer `corners` for anything rotated
 *     relative to the ray frame: its AABB claims the empty area around the
 *     rotated shape and produces phantom hits there.
 *   - **Polygon hit**: parametric line-segment vs axis-aligned ray. For
 *     `±X` rays: solve `t` such that the segment crosses `z = centerZ`;
 *     for `±Z` rays: solve `t` such that the segment crosses
 *     `x = centerX`. Perfectly parallel segments (`|dz| < ε` for `±X`
 *     rays, `|dx| < ε` for `±Z`) are skipped — they either miss the ray
 *     entirely or lie on it (degenerate; another adjacent edge will
 *     provide the meaningful hit).
 *   - **Tie-break**: AABBs beat polygons at equal distance (`<`, not
 *     `<=`) so a real obstacle exactly on the wall reports as the
 *     obstacle, not as the wall.
 *
 * Negative gaps (origin already past the face) are clamped to 0.
 *
 * Per repo rule §10 ("design for multiple consumers"), this lives in
 * `designer-core/src/helpers/math/plane/` so any UI overlay (FloorPlanUI
 * planar dimensions today, a future planar elevation overlay, …) shares
 * one implementation. Inputs are deliberately plain numbers (no `Item` /
 * `Vector3`) so the math has no scene-graph dependency and remains
 * trivial to test in isolation.
 */
const raycastClearances2D = (centerX, centerZ, blockers, polygon) => {
    const acc = {
        xPlus: unbounded(),
        xMinus: unbounded(),
        zPlus: unbounded(),
        zMinus: unbounded()
    };
    // ── Blockers ─────────────────────────────────────────────────────────
    // Processed before the polygon so that at an exactly equal distance the
    // blocker (written first, compared with a strict `<`) wins — a real
    // obstacle flush against a wall reports as the obstacle, not the wall.
    for (const c of blockers) {
        if (c.corners && c.corners.length >= 3) {
            if (isInsideLoop(centerX, centerZ, c.corners))
                continue; // overlapping the cast
            accumulateLoopCrossings(centerX, centerZ, c.corners, c.id, acc);
            continue;
        }
        const inZ = centerZ >= c.minZ && centerZ <= c.maxZ;
        const inX = centerX >= c.minX && centerX <= c.maxX;
        if (inZ) {
            if (c.minX > centerX) {
                const d = c.minX - centerX;
                if (d < acc.xPlus.distance)
                    acc.xPlus = aabbHit(d, c.id);
            }
            else if (c.maxX < centerX) {
                const d = centerX - c.maxX;
                if (d < acc.xMinus.distance)
                    acc.xMinus = aabbHit(d, c.id);
            }
        }
        if (inX) {
            if (c.minZ > centerZ) {
                const d = c.minZ - centerZ;
                if (d < acc.zPlus.distance)
                    acc.zPlus = aabbHit(d, c.id);
            }
            else if (c.maxZ < centerZ) {
                const d = centerZ - c.maxZ;
                if (d < acc.zMinus.distance)
                    acc.zMinus = aabbHit(d, c.id);
            }
        }
    }
    // ── Polygon edges ────────────────────────────────────────────────────
    accumulateLoopCrossings(centerX, centerZ, polygon, null, acc);
    return acc;
};

export { raycastClearances2D };
