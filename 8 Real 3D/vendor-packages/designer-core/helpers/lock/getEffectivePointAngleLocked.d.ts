import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
/**
 * Reads the **effective** angle-locked state of a corner. The result
 * drives the angle badge's (`AngularDimension`) commit gate in
 * `FloorPlanUI/AnglesUI` and (in tandem with
 * `getEffectivePointPositionLocked`) the per-arrow disabled flags
 * forwarded down to the badge.
 *
 * **Angle is locked when ANY of:**
 *
 * 1. The corner's own `isAngleLocked` property signal is `true` — the
 *    user explicitly locked the angle via the toolbar (a
 *    `SetNodePropertyValueCommand(pointId, 'isAngleLocked', true)` —
 *    the preferred channel for `properties` writes; typically paired
 *    with a sibling `SetNodePropertyValueCommand(pointId, 'isLocked',
 *    true)` inside one `runCommandsAsTransaction` so the locked
 *    angle's vertex cannot drift while its arms stay anchored to the
 *    angle constraint).
 * 2. **Both** adjacent room segments have `isLocked === true`. Two
 *    anchored arms cannot pivot around the corner without moving an
 *    endpoint, and every endpoint is pinned by its own segment lock —
 *    so the angle has no remaining DoF.
 *
 * **Asymmetry vs `getEffectivePointPositionLocked` is intentional.**
 * The position helper uses the looser ANY-adjacent-locked rule (one
 * anchored wall already removes the corner's translational DoF). The
 * angle helper sticks with the stricter BOTH-adjacent rule because, by
 * the spec:
 *
 *   > When we lock a wall: ... the user can still select [the corner]
 *   > in order to change the angle.
 *
 * With one free arm the user can pivot it around the now-anchored
 * corner — the angle is still editable, just constrained to "moving
 * endpoint must be on the unlocked arm". That single-anchor constraint
 * is expressed per-arrow on the badge (see `getEffectivePointDirection`
 * / `useEffectivePointDirection`), not as full angle-lock.
 *
 * **Falsy paths:**
 *
 * - The id does not resolve to a `Point` — return `false`.
 * - The corner has fewer than 2 adjacent segments — there is no angle
 *   to lock yet (drawing-in-progress / disconnected geometry). The
 *   explicit flag, if set, still wins; the segment-pair rule trivially
 *   does not fire.
 *
 * Allocation-free / side-effect-free — safe inside `useComputedValue`.
 */
export declare const getEffectivePointAngleLocked: (core: CoreDesigner, pointId: UUID) => boolean;
