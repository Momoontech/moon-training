import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
/**
 * Reads the **visual** locked state of a corner — `true` only when the
 * corner was EXPLICITLY locked by the user (its own `isLocked` AND own
 * `isAngleLocked` property signals are both set).
 *
 * **Why a separate helper from the effective-lock pair.**
 * `getEffectivePointPositionLocked` / `getEffectivePointAngleLocked`
 * fold in DERIVED locks — a corner becomes effectively position-locked
 * the moment ANY adjacent wall is locked, and effectively angle-locked
 * when BOTH walls are locked. Those derived rules are correct for
 * BEHAVIOUR (drag gates, per-arrow disable, read-only inputs), but they
 * are wrong for the corner's VISUAL treatment: locking a single wall
 * would otherwise paint both of that wall's corners as "locked" even
 * though the user never locked them — the same complaint already fixed
 * for the wall fill via `getEffectiveSegmentLocked` (own-flag only).
 *
 * The toolbar "lock corner" action writes BOTH `isLocked` and
 * `isAngleLocked` on the point inside one transaction (see the lock
 * notes in the package README). So "the user explicitly locked this
 * corner" is exactly `isLocked && isAngleLocked` on the point's own
 * flags — which is what this helper returns. A corner that is merely
 * pinned by an adjacent locked wall (position-locked but angle still
 * free) is NOT visually locked.
 *
 * Mirrors `getEffectiveSegmentLocked`'s own-flag-only philosophy for
 * the segment fill. Drives the `CornerPointState` token in
 * `RoomPointsUI/RoomPoint` (via the `usePointVisualLocked` hook). It is
 * intentionally NOT used for any drag / edit gate — those keep reading
 * the effective helpers.
 *
 * Returns `false` for a misrouted id (non-Point) — same falsy-on-
 * mismatch contract as the sibling helpers. Allocation-free /
 * side-effect-free — safe inside `useComputedValue`.
 */
export declare const getPointVisualLocked: (core: CoreDesigner, pointId: UUID) => boolean;
