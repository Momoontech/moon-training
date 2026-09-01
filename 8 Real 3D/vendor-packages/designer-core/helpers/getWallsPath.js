import polygonClipping from 'polygon-clipping';
import { getMonitor } from './monitor.js';
import { Vector2 } from './math/Vector2.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';
import roundWithNSigns from './roundWithNSigns.js';

const snap = (v) => roundWithNSigns(v, 4);
const toRing = (path) => path.map((p) => [snap(p.x), snap(p.y)]);
const ringToVector2 = (ring) => ring.map((point) => new Vector2(point[0], point[1]));
/**
 * Try to union all polygons in one shot (fastest path). If the library throws
 * "Unable to complete output ring" (common on near-degenerate inputs — e.g.
 * when two room polygons cross or share almost-coincident walls), fall back
 * to a pairwise loop that skips polygons whose union fails, so at least the
 * remaining rooms still contribute walls.
 */
function unionPolygons(polygons) {
    try {
        return polygonClipping.union(polygons[0], ...polygons.slice(1));
    }
    catch (fastError) {
        getMonitor().warn('[getWallsPath] polygon-clipping.union failed — retrying pairwise', fastError);
    }
    let acc = [polygons[0]];
    for (let i = 1; i < polygons.length; i++) {
        try {
            acc = polygonClipping.union(acc, [polygons[i]]);
        }
        catch (pairError) {
            getMonitor().warn(`[getWallsPath] polygon-clipping.union failed for polygon #${i} — skipping it`, pairError);
        }
    }
    return acc;
}
/**
 * Computes the outer boundary of multiple closed 2D paths by performing a union operation.
 *
 * Guarantees it never throws: on `polygon-clipping` numeric failures it falls
 * back to returning the sanitized input paths unchanged, so the caller can
 * still produce geometry without crashing the signal-effect pipeline.
 */
function getWallsPath(inputPaths) {
    if (inputPaths.length === 0) {
        return [];
    }
    if (inputPaths.length === 1) {
        return [ringToVector2(toRing(inputPaths[0]))];
    }
    const polygons = inputPaths.map((path) => [toRing(path)]);
    let result = null;
    try {
        result = unionPolygons(polygons);
    }
    catch (unexpectedError) {
        getMonitor().warn('[getWallsPath] unexpected polygon-clipping failure', unexpectedError);
    }
    if (!result || result.length === 0) {
        return polygons.map((polygon) => ringToVector2(polygon[0]));
    }
    return result.map((polygon) => ringToVector2(polygon[0]));
}

export { getWallsPath };
