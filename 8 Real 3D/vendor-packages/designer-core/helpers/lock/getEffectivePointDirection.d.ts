import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
import { Direction } from '../../declarations/ProjectSettings';
import { EffectiveDirection } from './types';
/**
 * Per-point effective direction view used by `AnglesUI` (the
 * AngleBadge consumer). Combines the global edit direction with the
 * corner's own angle-lock and each adjacent point's effective
 * position-locked state.
 *
 * **Angle-edit commit convention.** The angle-change callback in
 * `AnglesUI/handleAngleChange` rotates the MOVING adjacent point around
 * the corner while the FIXED one stays put. Which adjacent point a
 * given direction moves is decided GEOMETRICALLY — matching the badge's
 * on-screen CW/CCW arrow placement (`AnglesUI.geom`) rather than the
 * `getRoomSegmentsByPoint` array order. The rule (kept in lockstep with
 * the commit path):
 *
 *   - the CW arrow rotates `adj0` when `cross(toAdj0, toAdj1) >= 0`,
 *     else `adj1`;
 *   - the CCW arrow rotates the other one.
 *
 * So a side is disabled exactly when its moving endpoint cannot land —
 * the full {@link getEffectivePointMoveLocked} predicate, with the
 * edited vertex (`pointId`) passed as the rotation anchor:
 *
 *   - `isCWDisabled` — `true` when the corner is angle-locked
 *     (`getEffectivePointAngleLocked` — explicit flag OR both walls
 *     locked) OR moving the CW endpoint is forbidden: it is
 *     position-locked, its own angle is locked, OR its OTHER arm (not
 *     the one back to this vertex) ends at an angle-locked corner.
 *   - `isCCWDisabled` — same condition with the CCW endpoint.
 *
 * **The transitive arm check mirrors the wall-length fix.** Rotating an
 * adjacent corner about this vertex rebuilds that corner's far wall,
 * changing the angle at the wall's far corner; if that corner is
 * angle-locked the rotation must be disabled even though the rotated
 * corner is itself free. The arm leading back to this vertex is
 * excluded (it is the one whose bearing is meant to change) via the
 * anchor arg.
 *
 * Both flags being `true` means the angle is read-only — either because
 * the corner is fully angle-locked, or because neither adjacent point
 * may move.
 *
 * **Adjacency requirement.** An angle exists only when the corner has
 * exactly two adjacent room segments. For any other adjacency count
 * (1 — open polygon endpoint; 0 — disconnected; 3+ — branching, not
 * supported by AngleBadge today) both flags are `true` and the
 * direction passes through unchanged: there's nothing to commit, the
 * consumer should render the badge inert.
 *
 * Returns the global direction unchanged when the id does not resolve
 * to a `Point`.
 *
 * Allocation-free apart from the returned object; safe inside
 * `useComputedValue`.
 */
export declare const getEffectivePointDirection: (core: CoreDesigner, pointId: UUID, globalDirection: Direction) => EffectiveDirection;
