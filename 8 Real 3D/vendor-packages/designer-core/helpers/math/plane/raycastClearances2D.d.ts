import { UUID } from '../../../declarations';
/**
 * One radial clearance ray result. `distance` is the full ray length
 * (from the cast origin to the first hit) in the same units as the
 * inputs — always `≥ 0`.
 *
 * `source` discriminates the hit type:
 *   - `'aabb'`     — ray hit one of the input AABB blockers; `blockerId`
 *                    is the id passed in.
 *   - `'polygon'`  — ray hit one of the polygon edges; `blockerId` is `null`.
 *   - `'unbounded'`— neither a blocker nor the polygon stopped the ray
 *                    (origin is outside the polygon and no AABB hit was
 *                    found in this direction). `distance` is `Infinity`.
 */
export interface RayClearance2D {
    distance: number;
    source: 'aabb' | 'polygon' | 'unbounded';
    blockerId: UUID | null;
}
/** Quad of axis-aligned ray results in the (X, Z) plane. */
export interface RayClearances2D {
    /** Ray cast in `−X`. */
    xMinus: RayClearance2D;
    /** Ray cast in `+X`. */
    xPlus: RayClearance2D;
    /** Ray cast in `−Z`. */
    zMinus: RayClearance2D;
    /** Ray cast in `+Z`. */
    zPlus: RayClearance2D;
}
/** AABB on the (X, Z) plane plus an opaque id. */
export interface PlanarBlocker2D {
    id: UUID;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    /**
     * True convex footprint of the blocker on the (X, Z) plane, in vertex order.
     * When present it REPLACES the AABB fields for hit-testing (they stay useful
     * as a cheap pre-filter / for consumers that only need bounds).
     *
     * Supply this whenever the blocker is rotated relative to the ray frame: its
     * AABB then covers area the blocker does not occupy, and the ray reports a
     * phantom hit in that empty corner. See `projectUnitBoxToFootprint2D`.
     */
    corners?: ReadonlyArray<PlanarPoint2D>;
}
/** A 2D point in the same (X, Z) plane as `PlanarBlocker2D`. Polygon =
 * a closed loop of these (last edge implicitly connects last → first). */
export interface PlanarPoint2D {
    x: number;
    z: number;
}
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
export declare const raycastClearances2D: (centerX: number, centerZ: number, blockers: ReadonlyArray<PlanarBlocker2D>, polygon: ReadonlyArray<PlanarPoint2D>) => RayClearances2D;
