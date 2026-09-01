/**
 * Tests for `getEffectivePointMoveLocked` — the predicate behind the
 * per-arrow disable flags shared by `getEffectiveSegmentDirection`
 * (wall-length) and `getEffectivePointDirection` (corner angle).
 *
 * It answers "may this corner move, given a move that pivots/anchors
 * against `anchorPointId`?" and — crucially — looks ONE hop past the
 * corner's immediate neighbour: moving a corner rebuilds each of its
 * arms, rotating them about their far corners, so a locked angle at a
 * far corner must block the move even though the moved corner is itself
 * free. This is the fix for the lock-bypass where growing a free wall
 * silently rotated a locked angle two corners away.
 *
 * Graph (open polyline, 4 points / 3 segments):
 *
 *     P0 ── segA ── P1 ── segB ── P2 ── segC ── P3
 *
 * `P1` and `P2` are interior corners (two arms each), so the transitive
 * far-corner check has somewhere to reach. `Stage.segments` is seeded
 * explicitly because createMockCore does not populate it.
 */
export {};
