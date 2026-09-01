import { Node } from '../../../components/Node';
import type { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
import type { RoomPlanConfidence, RoomplanDoor, RoomplanObject, RoomplanOpening, RoomplanWindow, SimdFloat3, SimdFloat4x4 } from './types';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
/**
 * Extracts the confidence level from a RoomPlan discriminated-union confidence object.
 */
export declare function getConfidenceLevel(confidence: RoomPlanConfidence): ConfidenceLevel;
/**
 * Returns true when the surface's confidence meets or exceeds the given threshold.
 */
export declare function meetsConfidenceThreshold(confidence: RoomPlanConfidence, threshold: ConfidenceLevel): boolean;
/**
 * Converts a single floor `polygonCorner` from local floor-plane space to world XZ.
 *
 * Floor corners lie in the local XY plane (z ≈ 0), so we apply the floor's
 * transform matrix to the local 3-D point (lx, ly, 0) and read back world X and
 * world Z (which becomes the designer 2-D Y axis).
 *
 * The result is in RoomPlan meters. Scale to designer units before using.
 */
export declare function transformFloorCorner(corner: SimdFloat3, transform: SimdFloat4x4): {
    x: number;
    y: number;
};
export type ProductPlacement = {
    position: {
        x: number;
        y: number;
        z: number;
    };
    size: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
};
/**
 * Returns the object's position in **designer world 3D space** (inches), its
 * bounding-box size (inches), and an approximate Y rotation.
 *
 * @param obj      - The RoomPlan object.
 * @param floorY   - World Y of the floor surface (meters), used to normalise Y
 *                   so that floor level = 0 in the designer.
 *
 * NOTE: `position` is used as a query point (e.g. for nearest-wall lookups)
 * not for final item placement; `applyRoomPlanProducts` converts to mount-local
 * space separately using `getMatrixWorld(mountPlane).invert()`.
 */
export declare function extractLocalProductPlacement(obj: RoomplanObject | RoomplanDoor | RoomplanWindow | RoomplanOpening, parentNode: Node, yOffset?: number): ProductPlacement;
export declare function extractWorldProductPlacement(obj: RoomplanObject | RoomplanDoor | RoomplanWindow | RoomplanOpening, yOffset: number): ProductPlacement;
/**
 * Finds the wall `MountPlane` UUID whose geometric plane is closest to `point`
 * (in designer units / cm).
 *
 * For each stage segment: resolves segment → wall2D → children[0] (wall MountPlane),
 * builds a `Plane` via `getNodePlane`, and returns the UUID with the minimum
 * absolute perpendicular distance.
 *
 * @param point       - Query position in designer units (cm).
 * @param maxDistance - Optional upper bound (cm). Returns `null` when the nearest
 *                      wall exceeds this distance. Pass `undefined` to always
 *                      return the closest wall regardless of distance.
 *
 * Returns `null` when the stage has no segments, none have a valid wall
 * MountPlane, or the nearest wall exceeds `maxDistance`.
 */
export declare function findNearestWallMountPlane(core: CoreDesigner, stageId: UUID, point: {
    x: number;
    y: number;
    z: number;
}, maxDistance?: number): UUID | null;
