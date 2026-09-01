import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
/**
 * Decides whether moving a single corner (`pointId`) is forbidden by
 * the lock rules — including **transitive** angle locks one hop away.
 * This is the predicate behind the per-arrow disable flags for BOTH
 * editable inputs that move exactly one corner:
 *
 *   - Wall-length edit (`getEffectiveSegmentDirection`) — moving the
 *     segment's `to` (CW) or `from` (CCW). The OTHER endpoint of the
 *     edited segment is the `anchorPointId` (it stays put; the edited
 *     wall keeps its bearing because the moved endpoint slides along
 *     the wall's own axis).
 *   - Corner-angle edit (`getEffectivePointDirection`) — rotating one
 *     adjacent corner around the locked vertex. The vertex being
 *     edited is the `anchorPointId` (the rotation pivot).
 *
 * **Why the existing position-lock check was not enough.** The old
 * logic disabled an arrow only when the moved corner was effectively
 * position-locked. But moving a corner REBUILDS each of its arms — and
 * rebuilding an arm rotates it, which changes the angle at that arm's
 * FAR corner. If that far corner has a locked angle, the edit would
 * silently break the lock. Concretely (user report): top wall locked +
 * bottom-right corner angle-locked; selecting the LEFT wall still
 * offered a length edit in the free direction, because the moving
 * bottom-left corner was not itself position-locked — yet that move
 * rebuilds the bottom (diagonal) wall, rotating it and breaking the
 * angle lock at the bottom-right corner. The lock must look past the
 * immediate neighbour to the neighbour's neighbour.
 *
 * **Forbidden when ANY of:**
 *
 * 1. The corner is effectively position-locked
 *    ({@link getEffectivePointPositionLocked}) — it cannot move at all.
 * 2. The corner's OWN angle is effectively locked
 *    ({@link getEffectivePointAngleLocked}) — moving it changes the
 *    angle between its two arms, which is pinned. (Normally implied by
 *    #1, since the toolbar pairs the two flags; kept explicit so an
 *    angle-only lock — a future "lock angle, allow translate" mode —
 *    still blocks here.)
 * 3. Any adjacent arm whose FAR endpoint is NOT the anchor leads to a
 *    corner with a locked angle. Rebuilding that arm (the moved corner
 *    is its near endpoint) rotates it about the far corner, changing
 *    the far corner's locked angle. The arm leading back to the anchor
 *    is skipped: for a wall-length edit the moved corner slides along
 *    that arm's axis (bearing preserved → the anchor's angle is
 *    untouched); for an angle edit that arm IS the one whose bearing is
 *    meant to change, and the pivot's angle lock is handled by the
 *    caller's top-level guard.
 *
 * **One hop is sufficient.** Both edits move exactly ONE corner; every
 * other corner stays put. So only the moved corner's own angle and the
 * angles at its two immediate neighbours can change — there is no
 * deeper cascade to chase. The "neighbour's neighbour" the user asked
 * for is, from the edited wall's point of view, the far endpoint of the
 * moved corner's OTHER arm — reached by the `adjacent → far endpoint`
 * walk below.
 *
 * `O(adjacent-segments)` — allocation-free / side-effect-free, safe
 * inside `useComputedValue`. Returns `false` for a misrouted id
 * (non-Point), matching the sibling helpers' falsy-on-mismatch
 * contract.
 */
export declare const getEffectivePointMoveLocked: (core: CoreDesigner, pointId: UUID, anchorPointId: UUID) => boolean;
