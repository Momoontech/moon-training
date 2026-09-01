import { Direction } from '../../declarations/ProjectSettings';
/**
 * Per-badge view of the global edit direction folded with the local
 * lock state. Returned by `getEffectiveSegmentDirection` /
 * `getEffectivePointDirection` so consumers (DimensionsUI / AnglesUI /
 * Editor2D dimension overlays) get one cohesive object instead of three
 * loose computeds.
 *
 * - `direction` — the EFFECTIVE direction this badge should display as
 *   active. May differ from the global signal when the global side
 *   would commit an endpoint that's effectively position-locked AND
 *   the opposite side is free (auto-switch). When both sides are
 *   disabled, `direction` falls back to the global value (the badge is
 *   read-only at that point so the displayed direction is just an
 *   indicator, not actionable).
 * - `isCWDisabled` — clicking the CW arrow / committing in CW must be
 *   ignored. The badge consumer is expected to render the arrow muted
 *   (cursor: not-allowed, lower opacity) and to reject `setDirection`
 *   payloads of `Direction.CW` while this flag is on.
 * - `isCCWDisabled` — same as above for CCW.
 *
 * Both flags being `true` means the relevant input ("wall length" /
 * "corner angle") is fully read-only.
 */
export type EffectiveDirection = {
    direction: Direction;
    isCWDisabled: boolean;
    isCCWDisabled: boolean;
};
/**
 * Folds a globally chosen `Direction` against per-side disabled flags
 * and returns the EFFECTIVE direction the badge should highlight.
 *
 * Rule: if the global side is disabled but the opposite side is free,
 * auto-switch to the opposite. Otherwise keep the global value
 * unchanged. When both sides are disabled, the global value is returned
 * as-is — there is nothing to commit, and the consumer is expected to
 * render the input read-only.
 *
 * Pure / allocation-free / deterministic — safe inside any computed.
 */
export declare const applyDirectionLockOverride: (global: Direction, isCWDisabled: boolean, isCCWDisabled: boolean) => Direction;
