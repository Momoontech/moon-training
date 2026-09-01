/**
 * Tests for `helpers/perpendicularWallOffset.ts` — the two halves of the
 * "stretch the room instead of skewing it" wall-length edit:
 *
 *   - `getNeighborSegmentByDirection` — which wall the edit direction
 *     extends towards, and `null` on every ambiguous corner.
 *   - `isNeighborSegmentPerpendicular` — THE CONDITION. Accepts 90° and
 *     270° (the two windings) within `PERPENDICULAR_ANGLE_TOLERANCE_DEG`.
 *   - `buildPerpendicularWallOffsetCommands` — THE ACTION. Two
 *     `SetNodeVector2Command`s that resize the edited wall and translate
 *     the neighbour rigidly.
 *
 * Per-test isolation: shared core + `beforeEach` lock reset. The lock and
 * overflow describes mutate `properties` flags; the geometry describes are
 * pure reads (the builder returns commands, it never executes them), so
 * point positions stay at their `beforeAll` values throughout.
 *
 * Fixtures — positions in inches on the (x, position.y = world Z) plane.
 * Every rectangle is wound CCW, matching `normilezeSegmentsClosePath`.
 *
 *   RECT (no walls, the geometry bed)
 *     R3(0,30) ──S2── R2(100,30)          S0 R0→R1  bottom  +x  100
 *        │                 │              S1 R1→R2  right   +z   30
 *       S3                S1              S2 R2→R3  top     -x  100
 *        │                 │              S3 R3→R0  left    -z   30
 *     R0(0,0) ──S0──→ R1(100,0)
 *
 *   ITEMS  same shape, translated to y = 200. Its TOP wall carries a
 *          60"-wide product at wall-local x = 0, so shrinking the bottom
 *          wall below 60 must be refused.
 *
 *   SKEW   K0(0,0) ── K1(100,0) ── K2(140,30)      neighbour at 36.87°
 *   NEAR   two 2-wall corners, second arm at 90 ± delta (in / out of band)
 *   OPEN   E0(0,400) ── E1(100,400)                 no neighbour at all
 *   TEE    J1 carries three walls (J0-J1, J1-J2, J1-J3) — ambiguous
 *   ARC    A0(0,700) ──linear── A1(100,700) ──arc── A2(100,730)
 *
 *   LSHAPE (the fold case, y = 1000; registered as a Room since the fold guard
 *          is room-scoped)
 *     L5(0,1140) ─LS4─ L4(80,1140)      LS0 L0→L1  bottom  +x  200
 *        │                 │            LS1 L1→L2  right   +z   60
 *       LS5               LS3           LS2 L2→L3  shelf   -x  120
 *        │                 │            LS3 L3→L4  notch   +z   80
 *        │        L3(80,1060) ─LS2─ L2(200,1060)   LS4 top    -x   80
 *        │                                         LS5 left   -z  140
 *     L0(0,1000) ────────LS0────────→ L1(200,1000)
 *
 *     LS5 and LS2 are NON-adjacent. Shrinking LS0 anchored at its LEFT end
 *     moves LS1 inwards and the shelf absorbs it — valid. Anchored at the
 *     RIGHT end it slides LS5 to x = 160, straight through LS2 — the fold the
 *     guard must refuse.
 */
export {};
