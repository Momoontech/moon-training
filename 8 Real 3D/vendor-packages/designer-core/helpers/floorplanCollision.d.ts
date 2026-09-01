import { UUID } from '../declarations';
import { CoreDesigner } from '../designer-core';
import { Vector2 } from './math/Vector2';
/**
 * Returns true when `point` lies inside — or within one wall-thickness of —
 * any non-excluded room's polygon. Wall thickness (`wDepth`) comes from
 * project settings; see `getWallBuffer`. Holes are intentionally ignored.
 */
export declare const isPointBlockedByRooms: (core: CoreDesigner, point: Vector2, excludeRoomIds: UUID[]) => boolean;
/**
 * Returns true when the segment `from` -> `to` would be blocked by any room
 * on the current stage (excluding `excludeRoomIds`). "Blocked" means either
 * endpoint lands inside the room, or the segment's centerline comes within
 * `wDepth` of any polygon edge (accounts for wall thickness on both sides).
 */
export declare const isSegmentBlockedByRooms: (core: CoreDesigner, from: Vector2, to: Vector2, excludeRoomIds: UUID[]) => boolean;
/**
 * Batch variant of `isSegmentBlockedByRooms` — tests a bundle of segments
 * (e.g. every segment attached to a dragged corner) against every non-excluded
 * room polygon. Returns true as soon as any segment is blocked.
 */
export declare const areSegmentsBlockedByRooms: (core: CoreDesigner, segments: [Vector2, Vector2][], excludeRoomIds: UUID[]) => boolean;
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
export declare const wouldWallItemsOverflowAfterOverride: (core: CoreDesigner, segmentIds: UUID[], pointOverrides: Map<UUID, Vector2>) => boolean;
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
export declare const wouldCornerCollapseNeighbor: (core: CoreDesigner, candidate: Vector2, neighborEnds: Vector2[], startDists: number[]) => boolean;
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
export declare const isCornerTrajectoryCrossingWalls: (core: CoreDesigner, pointId: UUID, from: Vector2, to: Vector2, roomIds: UUID[]) => boolean;
export declare const isRoomSelfIntersectingAfterOverride: (core: CoreDesigner, roomId: UUID, pointOverrides: Map<UUID, Vector2>) => boolean;
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
export declare const wouldRoomWallsCrossAfterOverride: (core: CoreDesigner, roomId: UUID, pointOverrides: Map<UUID, Vector2>) => boolean;
