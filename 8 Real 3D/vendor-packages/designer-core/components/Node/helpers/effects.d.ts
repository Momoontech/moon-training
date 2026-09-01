import { NodeEffect } from '../../../designer-core';
/**
 * The 1-D span (start + length) a separator must cover to bracket its adjacent
 * sections on one axis: it starts at the lowest section start and spans to the
 * highest section end. Applied per axis — depth (z, top view) and height (y,
 * front view, where sections can differ in height). Pure — unit-tested; returns
 * `null` when there are no neighbouring sections (endpoint separator with a gap).
 */
export declare const separatorSpan: (segments: {
    start: number;
    size: number;
}[]) => {
    start: number;
    span: number;
} | null;
export declare const updateMultiClosetItemLayoutEffect: NodeEffect;
export declare const updateBoxContainerInteriorLayoutEffect: NodeEffect;
export declare const updateBoxContainerExteriorLayoutEffect: NodeEffect;
/**
 * Keeps `Ceiling2D.children` in sync with the room's cathedral context:
 *
 * - Flat ceiling -> exactly one MountPlane child at identity pose. Polygon
 *   shape is derived on-the-fly by `getMountPlaneShape` from the room
 *   footprint (no pose needed beyond identity).
 * - Cathedral ceiling -> N MountPlane children, one per facet, each with the
 *   facet's local pose. The polygon shape is again derived on demand by
 *   `getMountPlaneShape` from `room.cathedralContext`.
 *
 * Behavior on facet-count changes:
 * - When `oldCount === newCount`, only `position` / `rotation` are updated
 *   in place via `SetNodeVector3Command`. No MountPlane is recreated and no
 *   item is reparented, so drag and item-position state remain stable on
 *   pose-only edits (e.g. moving a single `BaseWallPoints` knot).
 * - When `oldCount !== newCount`, items hosted on each old MountPlane are
 *   reparented to the new MountPlane at `clamp(i, 0, newCount-1)`, then the
 *   old MountPlanes are removed and fresh ones are created at the new
 *   poses. This guarantees no item is orphaned by a topology change.
 *
 * All mutations go through `runCommandsAsTransaction(..., '', false)` so
 * they stay off the undo stack — synchronization is bookkeeping, not a
 * user action. The idempotent count comparison plus `vec3Equal`
 * short-circuit prevents the effect from re-emitting commands once the
 * tree matches the desired state.
 */
export declare const ceilingMountPlanesSyncEffect: NodeEffect;
/**
 * Re-validates `room.CeilingBaseWallId` whenever `room.path` changes.
 *
 * The ceiling base wall must reference a `Wall2D` whose parent `RoomSegment`
 * is one of the room's current path segments. When the user edits the
 * footprint (adds, removes, or replaces a segment), the previously chosen
 * base wall can become stale — e.g. its parent segment may have been removed
 * from the path, or the wall itself may have been disposed.
 *
 * Behavior:
 * - If the current `CeilingBaseWallId` still points to a `Wall2D` whose
 *   parent is a `RoomSegment` in `path`, leave it untouched.
 * - Otherwise overwrite it with the first `Wall2D` reachable from the new
 *   path (walk segments in order, take the first non-null `wall2D`).
 *
 * The effect tracks ONLY `room.path`. All other reads happen inside
 * `untracked()` so unrelated wall / segment edits do not re-trigger it.
 * This matches the spec ("when path property is updated") and prevents the
 * effect from clobbering a manual dropdown selection mid-edit.
 *
 * Writes go through `runCommandsAsTransaction(..., '', false)` to stay off
 * the undo stack — synchronization is bookkeeping, not a user action.
 */
export declare const updateCeilingBaseWallIdEffect: NodeEffect;
export declare const updateRoomBasePointsEffect: NodeEffect;
/**
 * Keeps each `RoomSegment.attributes['WallNumber']` in sync with its position
 * in the owning `Room`'s ordered segment list (outer `path` first, then each
 * hole flattened in declaration order). Numbering is 1-based and restarts per
 * Room.
 * Writes are skipped when the segment already holds the desired number,
 * making repeated runs idempotent. Mutations go through
 * `runCommandsAsTransaction(..., '', false)` so synchronization stays off the
 * undo stack — this is bookkeeping, not a user action.
 */
export declare const updateRoomSegmentWallNumbersEffect: NodeEffect;
/**
 * Stacks a multiCloset FreeBoxContainer's direct children (stacks + fix shelves)
 * bottom-to-top along Y and assigns each a cumulative `position.y`.
 *
 * Sizing: children flagged `isAutoSized` (the stacks) **fit the container** — they
 * split the height left after the fixed children (fix shelves, plus any stack that
 * is NOT auto-sized) evenly between them. Non-auto children keep their own `size.y`
 * (a fix shelf is body-thickness from its catalog formula; a fixed stack's size is
 * authoritative — e.g. snapped to the 32mm hole grid by the out-of-scope resize).
 * This mirrors the auto-size distribution in `updateBoxContainerInteriorLayoutEffect`.
 * Children size themselves on x/z via their own `freeBoxContainerSize` formulas;
 * there is no hole math here.
 *
 * Gated to the multiCloset flavor: the FreeBoxContainer class only registers this
 * effect when `freeBoxContainerType === multiCloset`, so plain containers are unaffected.
 */
export declare const updateMultiClosetFreeBoxContainerLayoutEffect: NodeEffect;
/**
 * Shelves stack — same unified model as drawers/hangers: shelf COMPONENTS
 * (`multiClosetComponentType: multiClosetShelfPart`, empty openings) interleaved with real fix-shelf boards
 * (`fixShelfHorizontal`, `freeBoxContainerInteriorPart`). Delegates to the shared band-layout
 * walk, which sizes the compartments as 32mm openings and leaves each board its own
 * body-thickness `size.y` formula.
 */
export declare const updateMultiClosetShelvesStackLayoutEffect: NodeEffect;
/** SHORT-hanging stack (the double-hang half-height rod) — tiles bands (see
 *  `applyStackBandsLayout`). Split from the long-hang and drawer effects so each can grow its
 *  own rules (rod height, min garment clearance) later, even though all four bodies are
 *  identical today. */
export declare const updateMultiClosetShortHangersStackLayoutEffect: NodeEffect;
/** LONG-hanging stack (the full-height rod) — tiles bands (see `applyStackBandsLayout`).
 *  Sibling of the short-hang effect above; see its note on why the two stay separate. */
export declare const updateMultiClosetLongHangersStackLayoutEffect: NodeEffect;
/** Drawers stack — tiles bands like hangers (see `applyStackBandsLayout`): drawers fill the
 *  `M` openings, with `M−1` assumed invisible fix-shelf dividers between them. Separate effect
 *  from hangers so each can grow its own rules (drawer-box depth, min/max height) later. */
export declare const updateMultiClosetDrawersStackLayoutEffect: NodeEffect;
