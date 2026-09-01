/**
 * Tests for `getMaxWallItemExtent` — the wall-local reach (`max(position.x +
 * size.x)`) of the farthest wall-mounted item on a segment. It is the
 * correctness gate behind every wall-shrink path (corner drag, segment drag,
 * dimension commit) via `wouldWallItemsOverflowAfterOverride`, so the geometry
 * (right axis, the no-wall / no-item early-outs, the per-item max, the uniform
 * MountPlane + MountLine walk, the NodeType.Item child guard) is pinned here.
 *
 * Per-test isolation: pure-read. Every test only *reads* the graph built once
 * in `beforeAll`; nothing mutates `core`. Each scenario is a self-contained
 * segment so no reset is needed — if a future edit makes a test mutate `core`,
 * reconsider this and switch to shape A (shared core + reset).
 *
 * Graph (one Wall2D per scenario, all parented under the stage):
 *
 *   SEG_NO_WALL2D   wall2D = null                         → arc/bezier-style, no wall
 *   SEG_EMPTY_WALL  Wall2D → [MountPlane, MountLine], no items
 *   SEG_SINGLE      Wall2D → MountPlane → 1 item (20 + 40 = 60)
 *   SEG_MULTI       Wall2D → MountPlane → items 30 / 65 / 15  (max 65)
 *   SEG_BOTH_MOUNTS Wall2D → MountPlane(item 40) + MountLine(item 70) (max 70)
 *   SEG_NON_ITEM    Wall2D → MountPlane → [Panel(non-item), item 50]  (max 50)
 */
export {};
