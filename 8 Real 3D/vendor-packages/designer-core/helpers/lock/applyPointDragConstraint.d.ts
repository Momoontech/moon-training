import { PointDragConstraint } from './getPointDragConstraints';
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
export declare const applyPointDragConstraint: (candidateX: number, candidateY: number, constraint: PointDragConstraint, out: [number, number]) => void;
