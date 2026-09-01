import { Box3 } from '../Box3';
import { Matrix4 } from '../Matrix4';
/**
 * Project the 8 unit-cube corners through `source × target` (apply
 * `source` first, then `target`) and write the resulting axis-aligned
 * bounding box — expressed in the *target* frame's coordinates — into
 * `out`. Returns `out` for chaining.
 *
 * Typical usage: compute a sibling node's AABB in the local frame of a
 * target node by passing
 *
 *   ```
 *   source = getMatrixWorld(sibling, true)   // with scale → (0..1)^3 → sibling box
 *   target = inverse(getMatrixWorld(item, false))  // pose-only inverse → world → item-local
 *   ```
 *
 * The 8 corners exactly span the source OBB when the source matrix has
 * scale baked in (which `getMatrixWorld(node, true)` does for the
 * node's size). Callers that want the unit cube projected through a
 * pose-only matrix (i.e. without the source size) should pre-scale
 * `source` themselves — this helper is intentionally agnostic.
 *
 * Hot-path safe — zero allocations; reuses module-level scratch.
 *
 * Used by:
 *   - `designer-core/itemClearances.ts::collectPlanarItemBlockers` —
 *     projects every `NodeType.Item` in the scene into the target item's
 *     local `(X, Z)` frame for the planar-clearance ray-cast.
 *   - Future drag/snap consumers that need an OBB→AABB projection in a
 *     specific reference frame (none today; `designer3d/drag` uses its
 *     own `dot`-based axis projections, but the corner constants are
 *     shared via `UNIT_BOX_CORNERS`).
 */
export declare const projectUnitBoxToBox3: (source: Matrix4, target: Matrix4, out: Box3) => Box3;
