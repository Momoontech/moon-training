import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
/**
 * One ray-from-pivot constraint produced by
 * {@link getPointDragConstraints}. The dragged point must stay on the
 * half-line emanating from `pivot` in direction `unitDir`, at any
 * non-zero distance — the wall connecting the dragged point to that
 * pivot may grow or shrink in length, but its bearing never changes,
 * preserving the locked angle.
 *
 * `pivotX` / `pivotY` and `unitDirX` / `unitDirY` are world inches /
 * unit-vector components in the floorplan XY plane (positive Z is
 * "up" / "into the room"). Plain numeric properties so callers don't
 * need to import `Vector2` to consume the snapshot.
 */
export type PointDragConstraint = {
    pivotX: number;
    pivotY: number;
    unitDirX: number;
    unitDirY: number;
};
/**
 * Builds the lock-aware drag constraints for `pointId` — one entry
 * per adjacent corner whose **angle is effectively locked**
 * ({@link getEffectivePointAngleLocked}).
 *
 * **Why angle-locked neighbours produce ray constraints.** A corner
 * with `isAngleLocked === true` (or sandwiched between two locked
 * walls — see `getEffectivePointAngleLocked`) holds the bearing of
 * each of its two arms fixed. The dragged point sits at the far end
 * of one such arm; if it moves off the bearing line, the angle at the
 * locked corner would change. Spec rule:
 *
 *   > When we lock a corner angle: ... Each wall can still change in
 *   > width, but it must change in the opposite direction of the
 *   > locked corner.
 *
 * Each entry pins the dragged point to the bearing line:
 *
 *   ```
 *   candidate = pivot + t * unitDir   (t > 0)
 *   ```
 *
 * Snapshot taken from CURRENT (drag-start) positions: pivot is the
 * locked corner's position, unitDir is the unit vector from pivot to
 * the dragged point's start position. Both are captured once at
 * `onStart` and reused for the duration of the drag — drag-time
 * mutations of the dragged point's position do not feed back into the
 * unit direction (which would let the user slowly rotate the arm by
 * cumulative drift).
 *
 * **Cardinality semantics for the consumer:**
 *
 *   - 0 constraints → free drag (no angle-locked neighbours).
 *   - 1 constraint  → 1-DoF drag along the ray; the consumer projects
 *     the cursor candidate onto it via {@link applyPointDragConstraint}.
 *   - 2+ constraints → drag is **impossible**. Two non-parallel rays
 *     intersect at a single point (the start position); two parallel
 *     non-coincident rays have no common point. Either way the point
 *     is effectively position-locked for the duration of the drag.
 *     The consumer (`RoomPoint.onStart`) bails the drag in that case.
 *
 * Constraints with a degenerate distance (`pivot === dragged point`
 * — should never happen for a well-formed scene) are skipped to keep
 * the unit direction well-defined.
 *
 * Allocation: returns a fresh array of plain objects. Called once per
 * drag (in `onStart`), never inside the per-frame `onMove` hot path.
 */
export declare const getPointDragConstraints: (core: CoreDesigner, pointId: UUID) => PointDragConstraint[];
