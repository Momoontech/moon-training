import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
/**
 * Reads the **drag-locked** state of a wall segment — `true` when the
 * segment cannot be moved as a rigid body via the perpendicular wall
 * drag in `RoomSegment.tsx`.
 *
 * **Drag is locked when ANY of:**
 *
 * 1. The segment's own `isLocked` property signal is `true` — same as
 *    `getEffectiveSegmentLocked`.
 * 2. Either endpoint is **effectively** position-locked
 *    ({@link getEffectivePointPositionLocked}). Spec:
 *
 *    > When we lock a wall: We can consider this as locking the
 *    > position of both corner points. Those corner points should no
 *    > longer be able to move.
 *
 *    The contrapositive enforced here: if a corner is effectively
 *    locked — by its own flag, or by being shared with ANOTHER locked
 *    wall — then translating this segment (which would move that
 *    corner) is forbidden.
 *
 * **Why a separate helper from `getEffectiveSegmentLocked`.**
 * `getEffectiveSegmentLocked` is consumed by
 * {@link getEffectiveSegmentDirection} to decide when **both**
 * direction arrows on the wall-length badge are disabled. Promoting
 * "any endpoint locked → segment locked" into that helper would
 * disable both arrows whenever a single endpoint is locked — but the
 * spec lets the user still edit the wall's length through the FREE
 * endpoint (the per-arrow disable on the busy side is what
 * `getEffectiveSegmentDirection` already produces). The drag gate is
 * the only seam that needs the stricter "any endpoint" rule, so it
 * gets its own helper.
 *
 * Allocation-free / side-effect-free — safe inside `useComputedValue`.
 */
export declare const getEffectiveSegmentDragLocked: (core: CoreDesigner, segmentId: UUID) => boolean;
