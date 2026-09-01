/**
 * Tests for the lock-derived drag-constraint helpers in `helpers/lock/`:
 *
 *   - `getEffectiveSegmentDragLocked` — separate from
 *     `getEffectiveSegmentLocked` because the perpendicular wall drag
 *     must also block on locked endpoints, while the wall-length
 *     "both arrows disabled" rule must NOT promote on a single locked
 *     endpoint (per-arrow disable handles that case).
 *
 *   - `getPointDragConstraints` — returns one ray-from-pivot snapshot
 *     per angle-locked neighbour. The dragged point is constrained to
 *     each ray during `onMove`. 2+ constraints means the drag should
 *     bail entirely (consumer responsibility).
 *
 *   - `applyPointDragConstraint` — projects a candidate onto a single
 *     ray with a positive-distance clamp.
 *
 * Graph reused from the other lock tests:
 *
 *     P0 ── seg1 ── P1 ── seg2 ── P2
 *
 * P1 is the interior corner; locking its angle leaves P0 / P2 as
 * angle-locked-neighbour candidates that should produce ray
 * constraints when dragging the OTHER side of seg1 / seg2.
 */
export {};
