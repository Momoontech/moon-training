import { CeilingFacet, Vec3 } from './computeCathedralContext';
/**
 * Per-facet pose + projected outline for a `MountPlane` that hosts items on
 * a single cathedral-ceiling facet.
 *
 * `position` / `rotation` are expressed in the parent `Ceiling2D`'s local
 * frame (which, for cathedral mode, is identity relative to the `Room` —
 * see `getCeilingLocalTransform`). `polygon2D` is the facet outline
 * projected into the MountPlane's own local 2D plane (the X/Y plane after
 * applying `position` + `rotation`).
 *
 * Conventions:
 * - The `MountPlane`'s local `+z` axis is the surface normal used by
 *   `getNodePlane` for ray/plane drag math; we orient it so it points DOWN
 *   into the room (matches `buildFacetGeometry` winding for cathedral
 *   facets).
 * - The local `+x` axis follows the first polygon edge so the projected 2D
 *   outline has a stable, intuitive orientation across recomputations.
 */
export type FacetMountPose = {
    position: Vec3;
    rotation: Vec3;
    polygon2D: {
        x: number;
        y: number;
    }[];
};
/**
 * Computes the local pose and projected outline for a single cathedral
 * facet. Pure-math: no signal reads, no Three.js scene state, safe to call
 * from both reactive effects and per-frame drag/hit-test code.
 */
export declare const computeFacetMountPose: (facet: CeilingFacet) => FacetMountPose | null;
export default computeFacetMountPose;
