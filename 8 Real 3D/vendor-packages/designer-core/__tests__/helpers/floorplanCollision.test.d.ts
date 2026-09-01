/**
 * Tests for `wouldWallItemsOverflowAfterOverride` — the shared wall-shrink gate
 * read by all three entry points (corner drag, segment drag, wall-length
 * dimension commit). It blocks a relocation that would shrink a wall below the
 * reach of its farthest mounted item (`getMaxWallItemExtent`), leaving a
 * product hanging past the wall end. Growth never blocks; the un-overridden
 * endpoint of a moved segment falls back to its live signal position; and the
 * `WALL_ITEM_EPS` slack means an item ending EXACTLY at the wall end is not
 * spuriously reported as overflowing.
 *
 * Per-test isolation: pure-read. Every test reads the graph built once in
 * `beforeAll` and passes its own scratch `pointOverrides` map (never a mutation
 * of `core`), so no reset is needed. If a future edit mutates `core`, switch to
 * shape A (shared core + reset).
 *
 * Graph (each segment is its own wall; positions in inches, all on y = 0):
 *
 *   SEG_OF      PA(10,0) ── PB(110,0)   item 20 + 40 = 60  → minLength 60, fits at 100
 *   SEG_FITS    PC(0,0)  ── PD(100,0)   item  0 + 30 = 30  → minLength 30, fits at 100
 *   SEG_NO_ITEM PE(0,0)  ── PF(100,0)   Wall2D, no items   → minLength 0 (always skipped)
 */
export {};
