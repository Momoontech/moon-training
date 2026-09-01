/**
 * Tests for the planar-clearance mount-group rule and the rotated-blocker
 * footprint, both exercised through `fitItemToSizeX` — the "grow to fill the
 * space" entry point behind the multiCloset drop-fit and the toolbar
 * "Fit to space".
 *
 * The rule: ceiling products obstruct only other ceiling products; everything
 * else (floor / countertop / wall / line) obstructs only its own group. A
 * ceiling light's plan footprint overlaps whatever stands beneath it, but
 * nothing on the floor can collide with it — counting it as a blocker used to
 * stop a growing closet feet short of the wall in open floor.
 *
 * Fixture geometry mirrors real saved data (`mock-data` room 30960): floor and
 * ceiling `MountPlane`s sit at position/rotation zero under Floor2D / Ceiling2D,
 * floor items carry rotation `Rx(+π/2)`, ceiling items `Rx(−π/2)` plus a
 * height in `position.z`. Each scenario is its own 200 × 200 room, offset far
 * enough along mount-Y that another room's items are always further away than
 * the scenario's own walls — blockers are collected scene-wide, only the
 * boundary polygon is per-room.
 *
 * Per-test isolation: pure-read. `fitItemToSizeX` only builds commands, it never
 * executes them, so the graph built once in `beforeAll` stays untouched.
 */
export {};
