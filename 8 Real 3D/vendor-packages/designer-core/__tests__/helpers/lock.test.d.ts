/**
 * Tests for the three effective-lock helpers in `helpers/lock/`.
 *
 * The two point helpers each combine an explicit signal on the corner
 * with a derived rule based on its adjacent segments — but the derived
 * rules are deliberately ASYMMETRIC:
 *
 *   - `getEffectivePointPositionLocked` — **ANY** locked adjacent
 *     segment promotes the corner to position-locked. Even one anchored
 *     wall removes every translational DoF (any move would change that
 *     wall's length or rotate it).
 *   - `getEffectivePointAngleLocked` — only **BOTH** adjacent segments
 *     locked promote the corner to angle-locked. With one free arm the
 *     angle can still pivot around the anchored corner.
 *
 * These tests exercise both rules separately, plus the misrouted-id and
 * partial-graph fallthroughs documented on each helper.
 *
 * Graph used by all tests:
 *
 *     P0 ── seg1 ── P1 ── seg2 ── P2
 *
 * `P1` (the middle corner) has two adjacent segments — the BOTH-adjacent
 * rule of `getEffectivePointAngleLocked` fires here. `P0` and `P2` each
 * have only one adjacent segment, so they exercise the
 * one-adjacent-locked branch on the position helper and the
 * stricter-rule fallthrough on the angle helper.
 *
 * `Stage.segments` is populated explicitly (the floorplan-converter
 * pipeline that normally fills it doesn't run in createMockCore). Without
 * it, `getRoomSegmentsByPoint` returns an empty array and every derived
 * rule reduces to the explicit flag.
 */
export {};
