import { getMatrixWorld } from '../../getMatrixWorld.js';
import { getNodePlane } from '../../getNodePlane.js';
import { Vector3 } from '../../math/Vector3.js';
import { Euler } from '../../math/Euler.js';
import { Matrix4 } from '../../math/Matrix4.js';
import '../../math/plane/unitBoxCorners.js';
import '../../math/plane/projectUnitBoxToFootprint2D.js';
import { Quaternion } from '../../math/Quaternion.js';

/** 1 meter expressed in designer units (inches). */
const METERS_TO_UNITS = 100 / 2.54; // ≈ 39.3701
const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 };
/**
 * Extracts the confidence level from a RoomPlan discriminated-union confidence object.
 */
function getConfidenceLevel(confidence) {
    if ('high' in confidence)
        return 'high';
    if ('medium' in confidence)
        return 'medium';
    return 'low';
}
/**
 * Returns true when the surface's confidence meets or exceeds the given threshold.
 */
function meetsConfidenceThreshold(confidence, threshold) {
    return CONFIDENCE_RANK[getConfidenceLevel(confidence)] >= CONFIDENCE_RANK[threshold];
}
/**
 * Converts a single floor `polygonCorner` from local floor-plane space to world XZ.
 *
 * Floor corners lie in the local XY plane (z ≈ 0), so we apply the floor's
 * transform matrix to the local 3-D point (lx, ly, 0) and read back world X and
 * world Z (which becomes the designer 2-D Y axis).
 *
 * The result is in RoomPlan meters. Scale to designer units before using.
 */
function transformFloorCorner(corner, transform) {
    const [lx, ly] = corner;
    const w = new Vector3(lx, ly, 0).applyMatrix4(new Matrix4().fromArray(transform));
    return { x: w.x, y: w.z };
}
const p = new Vector3();
const q = new Quaternion();
const s = new Vector3();
const m = new Matrix4();
const e = new Euler();
const mountQuat = new Quaternion();
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
function extractLocalProductPlacement(obj, parentNode, yOffset = 0) {
    const mountMatrix = getMatrixWorld(parentNode, false);
    const mountMatrixInv = mountMatrix.clone().invert();
    mountMatrix.decompose(p, mountQuat, s);
    const rpMatrix = m.fromArray(obj.transform);
    rpMatrix.decompose(p, q, s);
    s.set(obj.dimensions[0], obj.dimensions[1], obj.dimensions[2]);
    p.sub(s.clone().multiplyScalar(0.5).applyQuaternion(q)).add(new Vector3(0, -yOffset, 0));
    const localPos = p.clone().multiplyScalar(METERS_TO_UNITS).applyMatrix4(mountMatrixInv);
    const localSize = s.clone().multiplyScalar(METERS_TO_UNITS);
    const localQuat = mountQuat.invert().multiply(q);
    const localEuler = e.setFromQuaternion(localQuat, 'XYZ');
    return { size: localSize, position: localPos, rotation: localEuler };
}
function extractWorldProductPlacement(obj, yOffset) {
    const rpMatrix = m.fromArray(obj.transform);
    rpMatrix.decompose(p, q, s);
    s.set(obj.dimensions[0], obj.dimensions[1], obj.dimensions[2]);
    p.sub(s.clone().multiplyScalar(0.5).applyQuaternion(q)).add(new Vector3(0, -yOffset, 0));
    const localPos = p.clone().multiplyScalar(METERS_TO_UNITS);
    const localSize = s.clone().multiplyScalar(METERS_TO_UNITS);
    const localEuler = e.setFromQuaternion(q, 'XYZ');
    return { size: localSize, position: localPos, rotation: localEuler };
}
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
function findNearestWallMountPlane(core, stageId, point, maxDistance) {
    const stage = core.nodes.get(stageId);
    if (!stage)
        return null;
    const segmentIds = stage['segments']?.get() ?? [];
    if (segmentIds.length === 0)
        return null;
    const p = new Vector3(point.x, point.y, point.z);
    let nearestId = null;
    let minDistance = Infinity;
    for (const segmentId of segmentIds) {
        const segment = core.nodes.get(segmentId);
        if (!segment)
            continue;
        const wall2DId = segment['wall2D']?.get();
        if (!wall2DId)
            continue;
        const wall2D = core.nodes.get(wall2DId);
        const mountPlaneId = wall2D?.['children']?.get()?.[0];
        if (!mountPlaneId)
            continue;
        const mountPlaneNode = core.nodes.get(mountPlaneId);
        if (!mountPlaneNode)
            continue;
        const plane = getNodePlane(mountPlaneNode);
        const distance = Math.abs(plane.distanceToPoint(p));
        if (distance < minDistance) {
            minDistance = distance;
            nearestId = mountPlaneId;
        }
    }
    if (maxDistance !== undefined && minDistance > maxDistance)
        return null;
    return nearestId;
}

export { extractLocalProductPlacement, extractWorldProductPlacement, findNearestWallMountPlane, getConfidenceLevel, meetsConfidenceThreshold, transformFloorCorner };
