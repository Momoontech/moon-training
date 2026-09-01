import { Command } from '../components/commands/core/Command';
import { Direction, UUID } from '../declarations';
import { CoreDesigner } from '../designer-core';
/**
 * Half-width of the accepted band around a right angle, in degrees.
 *
 * A wall-length edit only offsets its neighbour wall when that neighbour
 * meets the edited wall at (near-)exactly 90°. The band exists purely to
 * absorb float noise from ortho-snapped rooms and from the `atan2` round
 * trip — it is NOT a "close enough to square" allowance. A wall the user
 * drew 1° off square is deliberately outside it and falls back to the
 * single-corner edit, because offsetting a not-quite-perpendicular
 * neighbour would rotate it and silently change two corner angles.
 */
export declare const PERPENDICULAR_ANGLE_TOLERANCE_DEG = 0.2;
/**
 * The one neighbour wall a length edit can offset, resolved from the
 * edit direction.
 *
 * - `segmentId` — the neighbour wall itself.
 * - `sharedPointId` — the corner both walls meet at. This is also the
 *   endpoint the edited wall's length change moves, so it is written by
 *   BOTH the single-corner path and the offset path.
 * - `farPointId` — the neighbour's other endpoint. Only the offset path
 *   writes it; that write is what turns "rotate the neighbour" into
 *   "translate the neighbour".
 */
export interface NeighborSegment {
    segmentId: UUID;
    sharedPointId: UUID;
    farPointId: UUID;
}
/**
 * Resolves the neighbour wall on the side the edit direction extends
 * towards: `Direction.CW` anchors `from` and moves `to`, so the neighbour
 * is the other wall meeting at `to`; `Direction.CCW` mirrors it.
 *
 * Returns `null` when there is no unambiguous neighbour — the corner
 * carries anything other than exactly two walls:
 *
 * - **one** wall — an open polyline end (still being drawn), nothing to
 *   offset;
 * - **three or more** — a T-junction or a corner shared between rooms,
 *   where "the next wall along" is not defined. Picking one arbitrarily
 *   would deform whichever room the picker happened to miss.
 *
 * `O(stage.segments)` — one linear scan via {@link getRoomSegmentsByPoint},
 * matching how every other point→segment lookup in the package works
 * (there is no adjacency index).
 */
export declare const getNeighborSegmentByDirection: (core: CoreDesigner, segmentId: UUID, direction: Direction) => NeighborSegment | null;
/**
 * THE CONDITION. `true` when the wall the edit direction extends towards
 * meets the edited wall at a right angle, so offsetting it as a rigid body
 * is the correct interpretation of the length change.
 *
 * Both walls are compared by their NATURAL (`from → to`) direction, so the
 * signed angle between them lands on **90° or 270°** depending on the room's
 * traversal winding — hence both are accepted. (Comparing outgoing-from-the-
 * corner directions instead would collapse the two into one case, but it
 * would also hide which way the room is wound, which the offset path does
 * not need and the reader would have to re-derive.)
 *
 * Returns `false` — i.e. the caller keeps today's single-corner behaviour —
 * when:
 *
 * - there is no unambiguous neighbour ({@link getNeighborSegmentByDirection});
 * - either wall is not linear (an arc/bezier has no single bearing, so
 *   "perpendicular" is undefined and translating one endpoint would change
 *   its radius / control geometry);
 * - either wall is degenerate (zero length);
 * - the angle is anything other than 90° / 270° within
 *   {@link PERPENDICULAR_ANGLE_TOLERANCE_DEG}.
 *
 * Pure and allocation-free — safe to call from a `useComputedValue`.
 */
export declare const isNeighborSegmentPerpendicular: (core: CoreDesigner, segmentId: UUID, direction: Direction, toleranceDeg?: number) => boolean;
/**
 * THE ACTION. Builds the commands that resize the edited wall to
 * `newLength` **and translate its perpendicular neighbour rigidly** by the
 * same vector, so the neighbour keeps both its length and its bearing and
 * the room stretches instead of skewing.
 *
 * Only call this when {@link isNeighborSegmentPerpendicular} is `true` — it
 * re-resolves the neighbour rather than taking it as a parameter so the two
 * halves stay independently callable, and returns `null` if the resolve now
 * fails.
 *
 * Two points move, in one transaction (the caller's) so the whole edit is a
 * single undo step:
 *
 * - the shared corner → `anchor + u * newLength`. Computed from the ANCHOR,
 *   bit-for-bit the same expression the single-corner path uses, so the
 *   committed wall length is identical between the two branches.
 * - the neighbour's far endpoint → offset by exactly the shared corner's
 *   displacement, so the neighbour translates rigidly (a `far + u * delta`
 *   form would drift by the last float bits and leave the neighbour a
 *   hair off its original bearing).
 *
 * Returns `null` on every refusal. `null` means **skip the whole operation**:
 * emit no commands, leave the plan untouched, and let the caller revert the
 * input to its previous value. There is no partial application and no
 * clamping to the nearest legal length — a refused edit must not silently
 * commit a number the user did not type into a box they are still looking at.
 * Refused when:
 *
 * - the neighbour can no longer be resolved, or either wall is degenerate;
 * - the neighbour's far endpoint is effectively position-locked. Note this
 *   single check also covers "the neighbour wall itself is locked" and "the
 *   wall beyond the neighbour is locked", since
 *   {@link getEffectivePointPositionLocked} promotes on ANY locked adjacent
 *   segment — and both of those walls would be moved / resized by this edit,
 *   which a lock forbids;
 * - the offset would fold the room inside-out, i.e. make a wall cross another
 *   wall of the same room ({@link wouldRoomWallsCrossAfterOverride}). This is
 *   the direction-asymmetric case: on a non-convex room, shrinking towards one
 *   end is fine while shrinking towards the other drags the neighbour straight
 *   through a wall further round the outline;
 * - shrinking would leave a wall-mounted product hanging past a wall end.
 *   Checked over every wall touching either moved point, via the same
 *   {@link wouldWallItemsOverflowAfterOverride} predicate the single-corner
 *   path and the drag-collision gates use, so all three agree on "fits".
 *
 * The caller is expected to have already gated the edited segment's own lock
 * and the shared corner's lock — those apply to both branches and belong
 * upstream of the branch.
 */
export declare const buildPerpendicularWallOffsetCommands: (core: CoreDesigner, segmentId: UUID, newLength: number, direction: Direction) => Command[] | null;
