import { CoreDesigner } from '../../designer-core';
import { Item } from '../../components/Node/components/Item';
import { Vector2 } from '../math/Vector2';
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
export declare const computeDependentRoomPoints: (core: CoreDesigner, closet: Item) => Vector2[];
