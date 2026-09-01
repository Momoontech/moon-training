import { Room } from '../../components/Node/components/Room';
import { UUID } from '../../declarations';
import { CeilingType } from '../../declarations/SurfaceSettings';
import { ProfilePoint } from './profileH';
export type Vec3 = {
    x: number;
    y: number;
    z: number;
};
/** Wall-local 2D top profile of a single Wall2D (origin = wall's `from`, +x along wall, +y up). */
export type WallTopProfile = ProfilePoint[];
export type CeilingFacet = {
    /**
     * Polygon perimeter in floorplan-local 3D
     * (XY in the floor plane, Z = height above the floor).
     * Vertex order matches the room footprint walk order — winding is fixed up
     * later by the geometry helper to produce downward-facing normals.
     */
    polygon: Vec3[];
    /** The two source profile knots (in base-wall local 2D) that bound this strip. */
    baseProfileSegment: [ProfilePoint, ProfilePoint];
};
export type CathedralContext = {
    type: CeilingType.Flat;
} | {
    type: CeilingType.Cathedral | CeilingType.Sloped | CeilingType.Other;
    baseWallId: UUID;
    /** Wall-local top profile per Wall2D, sorted left → right (ascending wall-local x). */
    wallTopProfiles: Map<UUID, WallTopProfile>;
    /** One facet per extended-profile segment. */
    ceilingFacets: CeilingFacet[];
};
/**
 * Computes everything wall and ceiling rendering need for the cathedral case.
 *
 * Coordinate convention: all 2D points live in the **floorplan-local
 * rendered frame** — i.e. `Point.position.y.getTransformed()` is used for Y
 * — so that the resulting facet polygons (lifted to 3D with Z = height) land
 * directly in the same frame the Floor2D / Ceiling2D groups already use.
 *
 * Returns `{ type: Flat }` when the room is not in cathedral mode or when
 * required attributes / structures are missing.
 */
export declare const computeCathedralContext: (room: Room) => CathedralContext;
