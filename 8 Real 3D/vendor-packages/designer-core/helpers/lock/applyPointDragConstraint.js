/**
 * Minimal positive distance from the pivot the dragged point is
 * allowed to land at. Prevents the point from collapsing onto the
 * pivot (which would zero out the wall length and invalidate the
 * unit-direction vector for any later re-projection that derives a
 * direction from the same pivot). One-thousandth of an inch is well
 * below the snap threshold and any meaningful design tolerance.
 */
const MIN_PROJ = 1e-3;
/**
 * Projects `candidateX` / `candidateY` onto the half-line described
 * by `constraint`:
 *
 *   ```
 *   out = pivot + max(MIN_PROJ, t) * unitDir
 *   t = dot(candidate − pivot, unitDir)
 *   ```
 *
 * Writes the result into `outX` / `outY` via the `out` array (which
 * the caller pre-allocates as a length-2 number tuple). No allocation
 * inside the call — safe inside the per-frame drag move loop.
 *
 * **Why a half-line, not a full line.** The locked corner's angle is
 * defined by the bearing FROM the corner TO the dragged point at
 * drag-start. Allowing `t < 0` would flip the dragged point to the
 * opposite side of the pivot — a 180° rotation of the arm — which
 * inverts the angle (turns interior into exterior or vice versa). The
 * `MIN_PROJ` clamp is the cleanest way to express "the wall can grow
 * shorter, but it cannot pass through the corner."
 *
 * Callers with multiple constraints should bail the drag entirely
 * (see {@link getPointDragConstraints} doc) — chaining this helper
 * across constraints does not produce a meaningful intersection.
 */
const applyPointDragConstraint = (candidateX, candidateY, constraint, out) => {
    const dx = candidateX - constraint.pivotX;
    const dy = candidateY - constraint.pivotY;
    const t = Math.max(MIN_PROJ, dx * constraint.unitDirX + dy * constraint.unitDirY);
    out[0] = constraint.pivotX + t * constraint.unitDirX;
    out[1] = constraint.pivotY + t * constraint.unitDirY;
};

export { applyPointDragConstraint };
