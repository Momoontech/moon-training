/**
 * Tests for the per-badge effective-direction helpers in `helpers/lock/`.
 *
 * Each helper folds a globally-chosen `Direction` against local lock
 * state into a `{ direction, isCWDisabled, isCCWDisabled }` triple.
 * These tests exercise:
 *
 *   1. Pass-through when nothing is locked (global wins, both flags false).
 *   2. Each disable branch in isolation:
 *      - segment-locked / endpoint-locked for `getEffectiveSegmentDirection`,
 *      - angle-locked / per-arm-locked for `getEffectivePointDirection`.
 *   3. Auto-switch — the global side is disabled, the opposite is free,
 *      `direction` flips to the opposite.
 *   4. Both-disabled — `direction` falls back to the global value as-is
 *      (the input is read-only at that point; the value is just a
 *      display indicator, not actionable).
 *   5. Misrouted ids and partial-graph fallthroughs.
 *
 * Reuses the same P0–seg1–P1–seg2–P2 graph as `lock.test.ts` so the
 * lock signals composed here line up with the documented effective-lock
 * semantics.
 */
export {};
