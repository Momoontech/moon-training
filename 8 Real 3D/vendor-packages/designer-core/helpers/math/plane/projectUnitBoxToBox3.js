import { Vector3 } from '../Vector3.js';
import { UNIT_BOX_CORNERS } from './unitBoxCorners.js';

// Module-level scratch — reused across calls. Hot-path safe; consumers
// rely on this helper running with no allocations (clearance walks
// inside `useComputedValue`, drag-snap candidate enumeration, etc.).
const _corner = new Vector3();
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
const projectUnitBoxToBox3 = (source, target, out) => {
    out.makeEmpty();
    for (let i = 0; i < 8; i++) {
        _corner.copy(UNIT_BOX_CORNERS[i]).applyMatrix4(source).applyMatrix4(target);
        if (_corner.x < out.min.x)
            out.min.x = _corner.x;
        if (_corner.x > out.max.x)
            out.max.x = _corner.x;
        if (_corner.y < out.min.y)
            out.min.y = _corner.y;
        if (_corner.y > out.max.y)
            out.max.y = _corner.y;
        if (_corner.z < out.min.z)
            out.min.z = _corner.z;
        if (_corner.z > out.max.z)
            out.max.z = _corner.z;
    }
    return out;
};

export { projectUnitBoxToBox3 };
