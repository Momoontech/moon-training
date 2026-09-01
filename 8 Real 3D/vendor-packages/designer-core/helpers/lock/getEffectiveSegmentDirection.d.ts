import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
import { Direction } from '../../declarations/ProjectSettings';
import { EffectiveDirection } from './types';
/**
 * Per-segment effective direction view used by `DimensionsUI` (and any
 * other wall-length badge consumer). Combines the global edit
 * direction (from `core.projectSettings.roomSettings.editingDirection`,
 * passed in to keep this helper pure) with the segment's own lock and
 * each endpoint's effective position-locked state.
 *
 * **Wall-length commit convention.** The length-edit callback in
 * `useSegmentLengthCallback` anchors one endpoint and translates the
 * other along the segment direction. The mapping is:
 *
 *   - `Direction.CW`  → anchor `from`, MOVE `to`
 *   - `Direction.CCW` → anchor `to`,  MOVE `from`
 *
 * So a side is disabled exactly when its moving endpoint cannot land —
 * which is now the full {@link getEffectivePointMoveLocked} predicate,
 * not just the endpoint's own position lock:
 *
 *   - `isCWDisabled` is `true` when the segment is locked (no length
 *     edit at all) OR moving the `to` endpoint is forbidden — `to`
 *     position-locked, OR `to`'s own angle locked, OR `to`'s OTHER arm
 *     (the one NOT leading to `from`) ends at an angle-locked corner.
 *   - `isCCWDisabled` is `true` when the segment is locked OR moving
 *     the `from` endpoint is forbidden — the symmetric rule with the
 *     anchor swapped to `to`.
 *
 * **The transitive arm check is the fix for the lock-bypass bug.**
 * Moving an endpoint rebuilds its other wall, rotating it and changing
 * the angle at that wall's far corner. If that far corner is
 * angle-locked, the length edit must be disabled even though the
 * endpoint itself is free to translate — otherwise the user could grow
 * the selected wall and silently break a locked angle two corners away.
 * The moved endpoint slides along THIS segment's axis, so this
 * segment's bearing (and the anchor's angle) is preserved — which is
 * why the arm leading back to the anchor is excluded from the check
 * (handled inside `getEffectivePointMoveLocked` via the anchor arg).
 *
 * Both flags being `true` means the wall-length input is read-only —
 * either the segment itself is locked, or neither endpoint may move.
 *
 * Returns the global direction as-is when the id does not resolve to a
 * `RoomSegment` (misrouted UUID, drawing-in-progress topology). Both
 * disabled flags are `false` in that case — the consumer is expected
 * to handle the missing-segment branch on its own (the badge wouldn't
 * be mounted for a non-segment id anyway).
 *
 * Allocation-free / side-effect-free — safe inside `useComputedValue`.
 * The returned object IS allocated per call; that's the price of
 * delivering a cohesive triple instead of three separate computeds.
 * Callers re-running this inside `useComputedValue` get value-equality
 * guarded results via the standard React key-by-key comparison.
 */
export declare const getEffectiveSegmentDirection: (core: CoreDesigner, segmentId: UUID, globalDirection: Direction) => EffectiveDirection;
