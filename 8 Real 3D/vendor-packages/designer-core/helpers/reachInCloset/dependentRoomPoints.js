import { calculateValue } from '../../components/Value/calculate.js';
import { Matrix4 } from '../math/Matrix4.js';
import { Vector2 } from '../math/Vector2.js';
import { Vector3 } from '../math/Vector3.js';
import { getMatrixWorld } from '../getMatrixWorld.js';

/**
 * Runtime type-guard for `InterpretedCurvePoint`. The exported `isLine`
 * helper in `declarations/InterpretedCurvePoint.ts` is typed against the
 * *catalog config* shape (`IInterpretedCurvePointConfig`), not the
 * already-resolved runtime shape (`InterpretedCurvePoint`). We do the
 * cheap narrowing locally to keep the helper signature ergonomic.
 */
const isLinearCurvePoint = (p) => p.type === undefined || p.type === 'lineTo' || p.type === 'moveTo';
// Reusable buffers — `computeDependentRoomPoints` is called from the
// reach-in-closet effect on every signal flush (i.e. potentially on every
// drag pointermove). Per the workspace performance rules, math objects must
// not be allocated in hot paths.
const _closetWorld = new Matrix4();
const _worldPoint = new Vector3();
/**
 * Coincidence tolerance (inches) used to drop the polygon-closure point —
 * the catalog convention authors a rectangular `roomShape` as
 * `moveTo (0,0) → lineTo (0,d) → lineTo (W,d) → lineTo (W,0) → lineTo (0,0)`,
 * where the trailing `lineTo` is a redundant closure back to the start.
 * Matches `POINT_EPS` in `effects.reachInCloset.ts` — anything below this
 * is below modeling precision (1/1000 inch).
 */
const CLOSURE_EPS = 1e-3;
/**
 * Evaluate a `reachInCloset` Item's `roomShape` curve and transform each
 * curve point from closet-local space into the 2D coordinate system used
 * for `Point.position` in the floorplan scene graph.
 *
 * Storage convention (matches `transformFloorCorner` in the RoomPlan
 * converter and `createPoint` / `createRoomPoint` in `helpers/floorplan.ts`):
 * `Point.position = (worldX, worldZ)`. The Y axis is consumed via
 * `TransformedValue.getTransformed()` which negates the raw value, so the
 * Floorplan's `-π/2` X-rotation in `getMatrixWorld` lands the point back
 * at world `(rawX, 0, rawY)`. Storing stage-local 3D Y directly (i.e. the
 * pre-rotation Y) would invert the value relative to every other Point
 * in the scene — which is the bug this helper used to hit.
 *
 * Coordinate mapping:
 * - `roomShape` is a top-down footprint authored in the closet's local
 *   frame; `shape.x` runs along the closet width (closet-local X) and
 *   `shape.y` is depth into the closet's recessed interior (closet-local
 *   Y is "up" — the closet's height axis, so depth maps to Z).
 * - The closet body sits *behind* the wall plane in closet-local space —
 *   wall MountPlane Z+ points into the user's room, so the recess that
 *   the dependent Room represents is along closet-local Z-. We therefore
 *   lift each `(sx, sy)` to `(sx, 0, -sy)`. Without the mirror the room
 *   footprint would appear in front of the closet (jutting into the user's
 *   room) instead of behind it.
 * - We then apply `closetWorld` to get a world-space point and read off
 *   `(world.x, world.z)` as the Stage-2D `Point.position`. `world.y` is
 *   the (irrelevant) height of the curve plane in world space.
 *
 * Only `lineTo` / `moveTo` curve points are supported. Arc and Bezier
 * points are skipped — the reach-in closet `roomShape` is by design a
 * polygonal footprint authored as straight segments. Skipping rather than
 * throwing keeps the effect tolerant if a catalog template happens to
 * include a non-linear point.
 *
 * The trailing polygon-closure point — the redundant `lineTo` back to
 * `moveTo`'s start that the catalog convention emits to close the curve
 * — is stripped before returning. `createDependentRoomForReachInCloset`
 * walks `result` as the ordered corner list and emits exactly one
 * `LinearRoomSegment` per pair `(result[i], result[(i + 1) % n])`, so a
 * coincident closing entry would yield a zero-length wall (`segmentN-1.to`
 * == `segment0.from` numerically but with a different `Point` UUID) plus
 * an extra `Point` co-located with the first — manifesting as a 5-vertex
 * polygon for a rectangular closet, an interior `RoomSegment` with
 * `from === to.position`, and the bug this drop addresses.
 */
const computeDependentRoomPoints = (core, closet) => {
    if (!closet.roomShape)
        return [];
    const shape = closet.roomShape.get();
    if (!shape || !shape.curve || shape.curve.length === 0)
        return [];
    // `getMatrixWorld(closet, false)` reads the closet's pose AND walks every
    // ancestor (MountPlane → Wall2D → RoomSegment → Stage → Floorplan), so
    // every signal in that chain is auto-tracked by the surrounding effect.
    getMatrixWorld(closet, false, _closetWorld);
    const options = { nodeId: closet.id };
    const result = [];
    for (let i = 0; i < shape.curve.length; i += 1) {
        const point = shape.curve[i];
        if (!isLinearCurvePoint(point))
            continue; // skip arc / bezier — see header comment
        const sx = calculateValue(point.x, core, options);
        const sy = calculateValue(point.y, core, options);
        // Mirror sy onto closet-local Z- so the footprint sits *behind* the
        // closet body (the recess in the wall), not in front of it.
        _worldPoint.set(sx, 0, -sy);
        _worldPoint.applyMatrix4(_closetWorld);
        // Floorplan-Point storage convention: (worldX, worldZ). See header.
        result.push(new Vector2(_worldPoint.x, _worldPoint.z));
    }
    // Strip trailing polygon-closure points coincident with the start. A
    // `while` (rather than a single `pop`) tolerates a hypothetical curve
    // that closes with multiple coincident `lineTo`s, but in practice the
    // canonical catalog shape only has one closure entry. Comparing in the
    // already-transformed world-space frame is fine — the matrix multiply
    // is affine, so coincident local points stay coincident in world space
    // up to IEEE754 noise that `CLOSURE_EPS` swallows.
    while (result.length >= 2) {
        const first = result[0];
        const last = result[result.length - 1];
        if (Math.abs(first.x - last.x) > CLOSURE_EPS || Math.abs(first.y - last.y) > CLOSURE_EPS)
            break;
        result.pop();
    }
    return result;
};

export { computeDependentRoomPoints };
