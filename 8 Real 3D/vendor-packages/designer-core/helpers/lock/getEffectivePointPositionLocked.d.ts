import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
/**
 * Reads the **effective** position-locked state of a corner — combining
 * the point's own `isLocked` flag with a derived rule based on its
 * adjacent segments. The result drives the drag gate in
 * `RoomPointsUI/RoomPoint`, the length-input read-only flag in
 * `FloorPlanUI/DimensionsUI`, and the per-arrow CW / CCW disabled flags
 * exposed on the dimension / angle badges.
 *
 * **Position is locked when ANY of:**
 *
 * 1. The corner's own `isLocked` property signal is `true` — i.e. the
 *    user explicitly locked this corner via the toolbar (a
 *    `SetNodePropertyValueCommand(pointId, 'isLocked', true)` — the
 *    preferred channel for `properties` writes; the underlying
 *    `Value<T>` can also be driven by `SetValueCommand`, but new
 *    callers should go through the property-level command so
 *    serialization stays uniform).
 * 2. **At least one** of the corner's adjacent room segments has
 *    `isLocked === true`. This is the rule called out by the task:
 *
 *    > When we lock a wall: We can consider this as locking the
 *    > position of both corner points. Those corner points should no
 *    > longer be able to move.
 *
 *    The asymmetry vs. {@link getEffectivePointAngleLocked} is intentional:
 *    one locked wall removes the corner's translational degrees of
 *    freedom — any corner move would either change that wall's length
 *    or rotate it, contradicting the lock — but leaves the **angle**
 *    between the two arms still adjustable: the user can pivot the
 *    FREE wall around the now-anchored corner without disturbing the
 *    locked one. Only when **both** adjacent walls are locked does the
 *    angle also lose its DoF, which is why
 *    `getEffectivePointAngleLocked` keeps the stricter "BOTH adjacent
 *    locked" rule.
 *
 * **Falsy paths:**
 *
 * - The id does not resolve to a `Point` — return `false`. Misrouted
 *   ids should NOT silently report "locked" from the consumer's
 *   perspective; the consumer (drag gate) will then proceed normally
 *   and the missing-node throw, if any, happens in the consumer's own
 *   `getNode` / `instanceof` chain. Returning `false` keeps this
 *   helper allocation-free and side-effect-free.
 * - The corner has zero adjacent segments (drawing in progress, or a
 *   stage with disconnected geometry). The derived rule trivially
 *   falls through; only the explicit flag matters.
 *
 * The helper is a plain `O(adjacent-segments)` read, allocation-free,
 * safe to call inside `useComputedValue` / `useSignalEffect` callbacks.
 * Callers that need the **angle**-locked state should use
 * `getEffectivePointAngleLocked` — same shape, but it requires BOTH
 * arms locked (one free arm still permits pivoting the angle) and the
 * explicit flag read is `isAngleLocked` instead of `isLocked`.
 */
export declare const getEffectivePointPositionLocked: (core: CoreDesigner, pointId: UUID) => boolean;
