import { Vector3 } from '../Vector3.js';

/**
 * The 8 corners of the unit cube `(0..1)^3` — the canonical reference
 * basis for any node bounding box that has its size baked into a world
 * matrix via `getMatrixWorld(node, true)` (the cube is then stretched
 * by the matrix to the node's actual size and rotated to its world pose).
 *
 * Exported as a frozen, ordered array so callers in
 * `designer3d/drag/snap.ts`, `designer3d/drag/collision.ts`, and
 * `designer-core/helpers/itemClearances.ts` can iterate the same vertices
 * in the same order. Index ordering is "XYZ binary": bit 0 → +Z, bit 1 →
 * +Y, bit 2 → +X. So index 4 = (1, 0, 0), index 7 = (1, 1, 1) — matches
 * the SAT axis derivation in `collision.ts::obbOverlaps` (which reads
 * indices 0, 1, 2, 4 for face normals).
 *
 * NOT to be mutated. Pass through `Vector3.copy()` if you need a
 * scratch copy to multiply by a matrix.
 *
 * Per repo rule §10 ("design for multiple consumers"), this lives in
 * `designer-core` so any package that needs to walk a node's 8 OBB
 * corners shares one ordered basis.
 */
const UNIT_BOX_CORNERS = Object.freeze([
    Object.freeze(new Vector3(0, 0, 0)),
    Object.freeze(new Vector3(0, 0, 1)),
    Object.freeze(new Vector3(0, 1, 0)),
    Object.freeze(new Vector3(0, 1, 1)),
    Object.freeze(new Vector3(1, 0, 0)),
    Object.freeze(new Vector3(1, 0, 1)),
    Object.freeze(new Vector3(1, 1, 0)),
    Object.freeze(new Vector3(1, 1, 1))
]);

export { UNIT_BOX_CORNERS };
