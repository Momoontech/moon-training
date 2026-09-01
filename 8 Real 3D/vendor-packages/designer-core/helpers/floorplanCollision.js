import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import { RoomType } from '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import getStage from '../components/Node/helpers/getStage.js';
import '../components/Node/components/AdjustableBox/index.js';
import '../components/Node/components/AdjustableExtrusion/index.js';
import '../components/Node/components/BoxContainer/index.js';
import '../components/Node/components/Carcass/index.js';
import '../components/Node/components/Ceiling2D/index.js';
import '../components/Node/components/Countertop/index.js';
import '../components/Node/components/CrownMolding/index.js';
import '../components/Node/components/Edgebanding/index.js';
import '../components/Node/components/Floor2D/index.js';
import '../components/Node/components/Frame/index.js';
import '../components/Node/components/FreeBoxContainer/index.js';
import '../components/Node/components/GateFrame/index.js';
import '../components/Node/components/Glass/index.js';
import '../components/Node/components/Image/index.js';
import '../components/Node/components/Item/index.js';
import '../components/Node/components/LaminateBox/index.js';
import '../components/Node/components/MiteredPanel/index.js';
import '../components/Node/BaseModel.js';
import '../components/Node/components/Molding/index.js';
import '../components/Node/components/MountLine/index.js';
import '../components/Node/components/MountPlane/index.js';
import '../components/Node/components/MountPoint/index.js';
import '../components/Node/components/Panel/index.js';
import '../components/Node/components/Part/index.js';
import '../components/Node/components/Point/index.js';
import '../components/Node/components/PointLight/index.js';
import '../components/Node/components/RawPanel/index.js';
import '@preact/signals-react';
import './cathedral/computeCathedralContext.js';
import '../components/Node/components/ShapedBoxContainer/index.js';
import '../components/Node/components/SpotLight/index.js';
import '../components/Node/components/Tiles/index.js';
import '../components/Node/components/ToeKickPanel/index.js';
import '../components/Node/components/Valance/index.js';
import '../components/Node/components/Wall2D/index.js';
import '../components/Node/components/WindowFrame/index.js';
import '../components/Node/helpers/effects.js';
import '../components/Node/helpers/effects.reachInCloset.js';
import '../components/Node/helpers/effects.wallHole.js';
import '../components/Node/helpers/defaultHoleCurve.js';
import './multiCloset/contentPartTypes.js';
import '../components/Node/helpers/getResizableSides.js';
import getRoom from '../components/Node/helpers/getRoom.js';
import getPoint from '../components/Node/helpers/getPoint.js';
import getRoomSegment from '../components/Node/helpers/getRoomSegment.js';
import '../components/Node/helpers/getSelectableNode.js';
import { Vector2 } from './math/Vector2.js';
import { isPointInPolygon } from './math/plane/isPointInPolygon.js';
import { pointToSegmentDistance } from './math/plane/pointToSegmentDistance.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';
import { segmentsIntersect } from './math/plane/segmentsIntersect.js';
import { segmentToSegmentDistance } from './math/plane/segmentToSegmentDistance.js';
import getRoomPolygon from './getRoomPolygon.js';
import { getMaxWallItemExtent } from './itemMeasurements.js';

// Module-level scratch for `isCornerTrajectoryCrossingWalls` — only one corner
// is dragged at a time, so a shared pair of `Vector2`s is safe and keeps the
// per-frame trajectory test allocation-free.
const _trajWallFrom = new Vector2();
const _trajWallTo = new Vector2();
/**
 * Thickness buffer used by every collision test: each wall extends `wDepth / 2`
 * on either side of its centerline, so two walls physically overlap when their
 * centerlines are closer than `wDepth` (sum of the two half-thicknesses).
 * Every dragged endpoint/segment in the floorplan is a corner/centerline of
 * such a wall, so the same buffer applies to corner-vs-wall tests too.
 */
const getWallBuffer = (core) => core.projectSettings.roomSettings.wDepth.get();
/**
 * Iterates every room on the current stage and yields its polygon (except for
 * rooms whose id is in `excludeRoomIds`). Rooms whose polygon couldn't be
 * built (fewer than 3 points) are silently skipped to keep call sites branch-free.
 *
 * **Dependent reach-in-closet rooms are skipped unconditionally.** A
 * `roomType: RoomType.reachInCloset` Room is bookkeeping owned by its closet
 * Item — its footprint is rebuilt every time the closet's pose / shape /
 * size changes by `updateReachInClosetDependentRoomEffect`, which runs
 * AFTER the signal flush that follows each drag command. Treating those
 * polygons as collision obstacles freezes the floor-plan: dragging a main-
 * room corner towards the closet wall produces a candidate whose neighbour
 * segment crosses the (still stale) dependent polygon, the bundle check
 * fires, the drag is gated to its last-valid position, and the user can no
 * longer move the corner — even though, once the dependent room re-runs,
 * the polygon would have moved out of the way. They are derived geometry,
 * not user-drawn obstacles, and must not participate in any collision test.
 */
const forEachRoomPolygon = (core, excludeRoomIds, callback) => {
    const stageId = core.currentStage.get();
    const stage = getStage(core, stageId);
    const roomIds = stage.rooms.get();
    for (const roomId of roomIds) {
        if (excludeRoomIds.includes(roomId))
            continue;
        if (getRoom(core, roomId).roomType.get() === RoomType.reachInCloset)
            continue;
        const polygon = getRoomPolygon(core, roomId);
        if (polygon.length < 3)
            continue;
        if (callback(polygon))
            return true;
    }
    return false;
};
/** `point` is inside `polygon` OR within `buffer` of any of its edges. */
const isPointNearOrInPolygon = (point, polygon, buffer) => {
    if (isPointInPolygon(point, polygon))
        return true;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (pointToSegmentDistance(point, polygon[j], polygon[i]) < buffer)
            return true;
    }
    return false;
};
/**
 * Segment `from → to` either has an endpoint inside `polygon`, crosses any of
 * its edges, or comes within `buffer` of any edge (the last two are folded
 * into `segmentToSegmentDistance`, which returns 0 on crossing).
 */
const isSegmentNearOrInPolygon = (from, to, polygon, buffer) => {
    if (isPointInPolygon(from, polygon))
        return true;
    if (isPointInPolygon(to, polygon))
        return true;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (segmentToSegmentDistance(from, to, polygon[j], polygon[i]) < buffer)
            return true;
    }
    return false;
};
/**
 * Returns true when `point` lies inside — or within one wall-thickness of —
 * any non-excluded room's polygon. Wall thickness (`wDepth`) comes from
 * project settings; see `getWallBuffer`. Holes are intentionally ignored.
 */
const isPointBlockedByRooms = (core, point, excludeRoomIds) => {
    const buffer = getWallBuffer(core);
    return forEachRoomPolygon(core, excludeRoomIds, (polygon) => isPointNearOrInPolygon(point, polygon, buffer));
};
/**
 * Returns true when the segment `from` -> `to` would be blocked by any room
 * on the current stage (excluding `excludeRoomIds`). "Blocked" means either
 * endpoint lands inside the room, or the segment's centerline comes within
 * `wDepth` of any polygon edge (accounts for wall thickness on both sides).
 */
const isSegmentBlockedByRooms = (core, from, to, excludeRoomIds) => {
    const buffer = getWallBuffer(core);
    return forEachRoomPolygon(core, excludeRoomIds, (polygon) => isSegmentNearOrInPolygon(from, to, polygon, buffer));
};
/**
 * Batch variant of `isSegmentBlockedByRooms` — tests a bundle of segments
 * (e.g. every segment attached to a dragged corner) against every non-excluded
 * room polygon. Returns true as soon as any segment is blocked.
 */
const areSegmentsBlockedByRooms = (core, segments, excludeRoomIds) => {
    const buffer = getWallBuffer(core);
    return forEachRoomPolygon(core, excludeRoomIds, (polygon) => {
        for (const [from, to] of segments) {
            if (isSegmentNearOrInPolygon(from, to, polygon, buffer))
                return true;
        }
        return false;
    });
};
/**
 * Tests whether `roomId`'s polygon would either self-intersect or bring two
 * non-adjacent walls closer than their combined thickness (`wDepth`) once
 * the points in `pointOverrides` are relocated. Non-overridden points keep
 * their current signal value.
 *
 * Only pairs with at least one moved edge are checked — static pairs can't
 * change. For moved pairs we block only when the new distance drops below
 * `buffer` AND below the original distance, so rooms that already violate
 * the thickness rule (e.g. after a previous bad commit) aren't trapped with
 * no way out: dragging them towards a better shape stays allowed.
 *
 * "Adjacent" means consecutive in the room's segment path, including the
 * wrap-around (first/last). Adjacent walls share a corner and are expected
 * to touch there.
 */
/**
 * Float slack so a wall whose item ends EXACTLY at the `to` end (extent ==
 * length) is not spuriously reported as overflowing on the next sub-inch
 * snap jitter. Inches scale, so 1e-6 is far below any meaningful dimension.
 */
const WALL_ITEM_EPS = 1e-6;
/**
 * Returns true when relocating the points in `pointOverrides` would shrink any
 * segment in `segmentIds` below the reach of a wall-mounted item on it — i.e.
 * leave a product hanging past the wall end (in the air). Non-overridden
 * endpoints keep their current signal position.
 *
 * For each segment the new length is the distance between its (possibly
 * overridden) endpoints; the segment is blocked when that length drops below
 * `getMaxWallItemExtent` (the wall-local reach of its farthest item, fixed for
 * the lifetime of the gesture since wall items are pinned to the wall frame).
 * Growth never blocks — a longer wall always still contains its items.
 *
 * Sibling of {@link isRoomSelfIntersectingAfterOverride} — same
 * `(segmentIds, pointOverrides)` shape so the floorplan drag-collision gates
 * (`isCornerDragBlocked` / `isSegmentDragBlocked`) and the wall-length
 * dimension commit (`useSegmentLengthCallback`) can all reuse it against the
 * same scratch override map. Assumes the wall starts in a valid state
 * (every item already fits); a wall that begins overflowing stays blocked
 * from shrinking further but can still grow back into validity.
 */
const wouldWallItemsOverflowAfterOverride = (core, segmentIds, pointOverrides) => {
    for (const segmentId of segmentIds) {
        const minLength = getMaxWallItemExtent(core, segmentId);
        if (minLength <= 0)
            continue;
        const segment = getRoomSegment(core, segmentId);
        const fromId = segment.from.get();
        const toId = segment.to.get();
        const fromOverride = pointOverrides.get(fromId);
        const toOverride = pointOverrides.get(toId);
        const fromPt = getPoint(core, fromId);
        const toPt = getPoint(core, toId);
        const fx = fromOverride ? fromOverride.x : fromPt.position.x.get();
        const fy = fromOverride ? fromOverride.y : fromPt.position.y.get();
        const tx = toOverride ? toOverride.x : toPt.position.x.get();
        const ty = toOverride ? toOverride.y : toPt.position.y.get();
        const newLength = Math.hypot(tx - fx, ty - fy);
        if (newLength + WALL_ITEM_EPS < minLength)
            return true;
    }
    return false;
};
/**
 * Returns true when moving a dragged corner to `candidate` would collapse one
 * of its connected walls below a wall-thickness (`wDepth`) — i.e. push the
 * corner into, or fold it back through, an adjacent neighbour corner.
 *
 * This gate closes a hole the other corner-drag checks structurally can't see:
 *   - the cross-room gates (`isSegmentBlockedByRooms` / `areSegmentsBlockedByRooms`)
 *     EXCLUDE the dragged corner's own rooms, so they never test the corner
 *     against a wall of its own room;
 *   - `isRoomSelfIntersectingAfterOverride` SKIPS adjacent edge pairs — the two
 *     walls sharing the moving corner always touch at that corner, so it cannot
 *     detect the corner sliding along and past the neighbour that joins them.
 * The net effect without this gate: dragging a corner straight at a connected
 * neighbour lets it pass through the neighbour and leave the room, even though
 * dragging it at any non-adjacent wall stops correctly.
 *
 * `neighborEnds[i]` is the far endpoint of the i-th segment attached to the
 * dragged corner; `startDists[i]` its distance from the corner at drag-start.
 * Escape hatch (mirrors {@link isRoomSelfIntersectingAfterOverride} and
 * {@link wouldWallItemsOverflowAfterOverride}): a wall that already starts
 * shorter than the buffer can still grow — only shrinking it further is blocked
 * — so a pre-existing sub-thickness wall never traps its corner.
 */
const wouldCornerCollapseNeighbor = (core, candidate, neighborEnds, startDists) => {
    const buffer = getWallBuffer(core);
    for (let i = 0; i < neighborEnds.length; i++) {
        const d = candidate.distanceTo(neighborEnds[i]);
        if (d < buffer && d < startDists[i])
            return true;
    }
    return false;
};
/**
 * Returns true when the path a dragged corner travels this frame
 * (`from` = last-valid position → `to` = candidate) CROSSES any wall of its
 * own room(s) that is not attached to the corner itself.
 *
 * This is the trajectory backstop the static gates miss. Both
 * `isRoomSelfIntersectingAfterOverride` and the cross-room checks only look at
 * the candidate's final position, so once the corner is pressed flush against a
 * wall (last-valid hugging it) a single larger step can land the candidate on
 * the FAR side of that wall — the "getting closer" escape hatch in
 * `isRoomSelfIntersectingAfterOverride` (`dNew < dOrig`) then reads the post-
 * crossing gap as "moving away" and lets the corner tunnel straight through,
 * out of the room. Testing the swept segment instead of the endpoint closes
 * that hole regardless of drag speed.
 *
 * Walls incident to the dragged corner (`from`/`to` equal to `pointId`) are
 * skipped — they move WITH the corner, so its trajectory trivially "meets"
 * them at the shared endpoint. Every other wall is static this frame and a
 * genuine crossing means the corner left the valid region. Uses a strict
 * segment-crossing test (not the wall-thickness buffer) so sliding a corner
 * parallel to a nearby wall is never mistaken for a crossing — proximity stays
 * the job of the buffer-based gates.
 */
const isCornerTrajectoryCrossingWalls = (core, pointId, from, to, roomIds) => {
    for (const roomId of roomIds) {
        const room = getRoom(core, roomId);
        for (const segId of room.path.get()) {
            const seg = getRoomSegment(core, segId);
            const fromId = seg.from.get();
            const toId = seg.to.get();
            if (fromId === pointId || toId === pointId)
                continue; // wall moves with the corner
            const a = getPoint(core, fromId);
            const b = getPoint(core, toId);
            _trajWallFrom.set(a.position.x.get(), a.position.y.get());
            _trajWallTo.set(b.position.x.get(), b.position.y.get());
            if (segmentsIntersect(from, to, _trajWallFrom, _trajWallTo))
                return true;
        }
    }
    return false;
};
const isRoomSelfIntersectingAfterOverride = (core, roomId, pointOverrides) => {
    const buffer = getWallBuffer(core);
    const room = getRoom(core, roomId);
    const segIds = room.path.get();
    const n = segIds.length;
    if (n < 4)
        return false;
    const edges = [];
    for (const segId of segIds) {
        const seg = getRoomSegment(core, segId);
        const fromId = seg.from.get();
        const toId = seg.to.get();
        const fromPt = getPoint(core, fromId);
        const toPt = getPoint(core, toId);
        const origFrom = new Vector2(fromPt.position.x.get(), fromPt.position.y.get());
        const origTo = new Vector2(toPt.position.x.get(), toPt.position.y.get());
        const fromOverride = pointOverrides.get(fromId);
        const toOverride = pointOverrides.get(toId);
        edges.push({
            origFrom,
            origTo,
            newFrom: fromOverride ?? origFrom,
            newTo: toOverride ?? origTo,
            moved: fromOverride !== undefined || toOverride !== undefined
        });
    }
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (j === i + 1)
                continue;
            if (i === 0 && j === n - 1)
                continue;
            if (!edges[i].moved && !edges[j].moved)
                continue;
            const dNew = segmentToSegmentDistance(edges[i].newFrom, edges[i].newTo, edges[j].newFrom, edges[j].newTo);
            if (dNew >= buffer)
                continue;
            const dOrig = segmentToSegmentDistance(edges[i].origFrom, edges[i].origTo, edges[j].origFrom, edges[j].origTo);
            if (dNew < dOrig)
                return true;
        }
    }
    return false;
};
/**
 * Returns true when relocating the points in `pointOverrides` would make one
 * of `roomId`'s walls pass THROUGH another — i.e. turn the room outline
 * inside-out. Non-overridden points keep their current signal value.
 *
 * Strict-crossing sibling of {@link isRoomSelfIntersectingAfterOverride}, and
 * deliberately NOT a replacement for it. The difference is the whole reason
 * this exists:
 *
 *   - that one is a PROXIMITY gate — it blocks whenever two walls come within
 *     `wDepth` of each other, which is right for a drag (you must not push two
 *     wall bodies into the same space) but wrong for a length commit, where a
 *     legitimate result routinely leaves two walls flush or collinear —
 *     "extending each other" rather than colliding.
 *   - this one asks only "do these two centerlines actually cross?" via
 *     {@link segmentsIntersect}, which reports parallel / collinear pairs
 *     (`|cross| ≈ 0`) as non-intersecting. So walls that end up flush or
 *     collinear pass, and only a genuine inside-out fold is refused.
 *
 * Adjacency is compared **by endpoint id, not by path index**: two walls
 * sharing a corner necessarily meet there, and `segmentsIntersect` reports an
 * endpoint touch as an intersection, so every such pair must be skipped.
 * Going by id also stays correct for a room whose `path` is not a clean
 * forward chain, where "consecutive" would not imply "shares a corner".
 *
 * Only pairs with at least one moved edge are tested — a static pair cannot
 * newly cross. Escape hatch, mirroring the sibling gates: a pair that ALREADY
 * crossed before the override does not block, so a room left folded by an
 * earlier bad commit can still be edited back into shape.
 */
const wouldRoomWallsCrossAfterOverride = (core, roomId, pointOverrides) => {
    const room = getRoom(core, roomId);
    const segIds = room.path.get();
    const n = segIds.length;
    // With three walls every pair shares a corner, so nothing is testable.
    if (n < 4)
        return false;
    const edges = [];
    for (const segId of segIds) {
        const seg = getRoomSegment(core, segId);
        const fromId = seg.from.get();
        const toId = seg.to.get();
        const fromPt = getPoint(core, fromId);
        const toPt = getPoint(core, toId);
        const origFrom = new Vector2(fromPt.position.x.get(), fromPt.position.y.get());
        const origTo = new Vector2(toPt.position.x.get(), toPt.position.y.get());
        const fromOverride = pointOverrides.get(fromId);
        const toOverride = pointOverrides.get(toId);
        edges.push({
            fromId,
            toId,
            origFrom,
            origTo,
            newFrom: fromOverride ?? origFrom,
            newTo: toOverride ?? origTo,
            moved: fromOverride !== undefined || toOverride !== undefined
        });
    }
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const a = edges[i];
            const b = edges[j];
            if (!a.moved && !b.moved)
                continue;
            if (a.fromId === b.fromId || a.fromId === b.toId || a.toId === b.fromId || a.toId === b.toId)
                continue;
            if (!segmentsIntersect(a.newFrom, a.newTo, b.newFrom, b.newTo))
                continue;
            if (segmentsIntersect(a.origFrom, a.origTo, b.origFrom, b.origTo))
                continue;
            return true;
        }
    }
    return false;
};

export { areSegmentsBlockedByRooms, isCornerTrajectoryCrossingWalls, isPointBlockedByRooms, isRoomSelfIntersectingAfterOverride, isSegmentBlockedByRooms, wouldCornerCollapseNeighbor, wouldRoomWallsCrossAfterOverride, wouldWallItemsOverflowAfterOverride };
