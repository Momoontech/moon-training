import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import { MountType } from '../declarations/helpers.js';
import { VectorProps } from '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
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
import getOptionalNode from '../components/Node/helpers/getOptionalNode.js';
import '../components/Node/helpers/getResizableSides.js';
import getOptionalParentRoom from '../components/Node/helpers/getOptionalParentRoom.js';
import getOptionalParentWall2D from '../components/Node/helpers/getOptionalParentWall2D.js';
import getParentRoomSegment from '../components/Node/helpers/getParentRoomSegment.js';
import '../components/Node/helpers/getSelectableNode.js';
import { getMatrixWorld } from './getMatrixWorld.js';
import { Box3 } from './math/Box3.js';
import { Euler } from './math/Euler.js';
import { Vector3 } from './math/Vector3.js';
import { Matrix4 } from './math/Matrix4.js';
import { projectUnitBoxToBox3 } from './math/plane/projectUnitBoxToBox3.js';
import { projectUnitBoxToFootprint2D } from './math/plane/projectUnitBoxToFootprint2D.js';
import { raycastClearances2D } from './math/plane/raycastClearances2D.js';
import './math/plane/unitBoxCorners.js';
import { Quaternion } from './math/Quaternion.js';
import SetNodeVector3Command from '../components/commands/SetNodeVector3Command.js';
import { setWallItemPosition } from './itemMeasurements.js';
import { isCeilingMountedNode } from './itemMountGroups.js';
import { projectNode } from './project.js';
import { computeSegmentLength } from './segmentMeasurements.js';

// ---------------------------------------------------------------------------
// Pure 2D math
// ---------------------------------------------------------------------------
const boundary = (distance) => ({
    distance: Math.max(0, distance),
    source: 'boundary',
    blockerItemId: null
});
/**
 * Pure axis-aligned 2D clearance computation. Reusable from any UI overlay
 * that has a flat 2D rectangle layout (Editor2D wall view today,
 * FloorPlanUI elevation/floor view tomorrow).
 *
 * Algorithm (per direction):
 *   - Start with the boundary baseline (wall start / wall end / floor).
 *   - For each candidate, require *lateral overlap* on the orthogonal
 *     axis — only neighbors that share a horizontal corridor can block a
 *     horizontal clearance, and vice versa. Touching edges (`==`) do NOT
 *     count as overlap; this matches the snap-tolerance idiom in
 *     `designer3d/drag/snap.ts::contributeNeighbors` and prevents a
 *     stacked item directly above the target from "blocking" a sideways
 *     gap.
 *   - Among qualifying candidates, pick the one whose facing edge is
 *     closest. Negative gaps (overlap) are clamped to 0.
 *
 * AABB-only by design (see plan §3 for why we don't reuse `obbOverlaps`):
 * wall items have rotation `(0,0,0)` from `getMountDefaultRotation`, so an
 * axis-aligned check is exact in production. If rotated wall items arrive,
 * swap the lateral test for the projected-interval pattern from
 * `contributeNeighbors` — no API change.
 */
const compute2DClearances = (target, candidates, bounds) => {
    const aLeft = target.left;
    const aRight = target.left + target.width;
    const aBottom = target.bottom;
    const aTop = target.bottom + target.height;
    let left = boundary(aLeft - bounds.left);
    let right = boundary(bounds.right - aRight);
    let down = boundary(aBottom - bounds.bottom);
    for (const c of candidates) {
        const cLeft = c.left;
        const cRight = c.left + c.width;
        const cBottom = c.bottom;
        const cTop = c.bottom + c.height;
        // Vertical overlap → candidate sits on the same horizontal corridor.
        const verticalOverlap = cTop > aBottom && cBottom < aTop;
        // Horizontal overlap → candidate sits on the same vertical corridor.
        const horizontalOverlap = cRight > aLeft && cLeft < aRight;
        if (verticalOverlap) {
            if (cRight <= aLeft) {
                const gap = Math.max(0, aLeft - cRight);
                if (gap < left.distance)
                    left = { distance: gap, source: 'item', blockerItemId: c.id };
            }
            if (cLeft >= aRight) {
                const gap = Math.max(0, cLeft - aRight);
                if (gap < right.distance)
                    right = { distance: gap, source: 'item', blockerItemId: c.id };
            }
        }
        if (horizontalOverlap) {
            if (cTop <= aBottom) {
                const gap = Math.max(0, aBottom - cTop);
                if (gap < down.distance)
                    down = { distance: gap, source: 'item', blockerItemId: c.id };
            }
        }
    }
    return { left, right, down, bounds };
};
// ---------------------------------------------------------------------------
// Wall-specific scene-graph wrapper
// ---------------------------------------------------------------------------
// Module-level scratch for the wall candidate walk. Mirrors the
// `_itemMatrix` / `_siblingMatrix` scratch used by the planar path — read
// side only, never overlaps with the write side because pose mutations go
// through commands.
const _wallMatrix = new Matrix4();
const _wallInverse = new Matrix4();
const _wallCandidateMatrix = new Matrix4();
const _wallCandidateBox = new Box3();
/**
 * Collect every Item in the same `Room` as the target, projected into the
 * target wall's local 2D frame and flattened to a `ClearanceRect`.
 *
 * Walks the room's mount surface set:
 *   - `room.path` segments → for each kept segment, walk its
 *     `wall2D.children` (MountPlane + MountLine for the wall slot).
 *     **Restricted to the target's own segment plus its two topological
 *     neighbors** (previous and next in the closed path loop). Any other
 *     path segment's wall is too far away to ever physically reach this
 *     wall plane, so projecting and Z-strip-rejecting them is wasted
 *     work and broadens reactivity to unrelated walls.
 *   - `room.holes` segments (flattened) → same wall walk for interior
 *     hole walls. Holes are NOT subject to the path-neighbors restriction
 *     — interior cutouts are typically small enough that any hole wall
 *     can be near the target wall, and the optimization was scoped to
 *     `path` on purpose.
 *   - `room.floor2D.children` (floor MountPlanes).
 *   - `room.ceiling2D.children` (ceiling MountPlanes).
 *
 * Each MountPlane / MountLine's `children` is an `Item` list. For every
 * sibling item we project the world AABB
 * (`getMatrixWorld(sibling, true) × wallInverse`) and flatten to the
 * wall-local (x, y) plane. The wall-normal axis (wall-local Z) is
 * dropped, but FIRST we reject any item whose AABB lies outside the
 * target's own depth zone `z ∈ [-target.size.z, +target.size.z]` —
 * a candidate outside that slab cannot physically conflict with the
 * target's volume regardless of how it lays out in (x, y). The candidate's
 * own depth is already encoded in its projected AABB extents, so only the
 * target's depth needs to enter the test. Symmetric `±depth` is used (vs.
 * the strictly correct one-sided `[0, depth]`) so the predicate doesn't
 * depend on the wall-rotation sign convention; the path-neighbors
 * restriction above already filters out items that would sit on the
 * "wrong" side of the wall plane in practice.
 *
 * Mirrors `collectPlanarItemBlockers` (lines ~432-466) — same parent-type
 * filter (`MountPlane` / `MountLine`, which excludes interior items
 * parented via `MountPoint`), same world-AABB projection, same
 * signal-tracking shape (re-runs on add / remove inside the kept scope
 * and on any kept sibling's pose change).
 */
const collectWallItemBlockers = (core, item, room, segmentId, wallInverse) => {
    const candidates = [];
    // Target's own depth defines the wall-normal slab a candidate must reach
    // to count as a blocker. Read once outside the loop — already a tracked
    // signal alongside `size.x` / `size.y`, so resizing the target naturally
    // re-runs the overlay's `useComputedValue`.
    const targetDepth = item.size.z.get();
    const targetIsCeiling = isCeilingMountedNode(core, item.id);
    const visitMountSurface = (surfaceId) => {
        const surface = getOptionalNode(core, surfaceId);
        if (!surface)
            return;
        if (surface.type !== NodeType.MountPlane && surface.type !== NodeType.MountLine)
            return;
        for (const childId of surface.children.get()) {
            if (childId === item.id)
                continue;
            const sibling = getOptionalNode(core, childId);
            if (!sibling || sibling.type !== NodeType.Item)
                continue;
            // Mount-group gate — see `itemMountGroups.ts`. Mirrors
            // `collectPlanarItemBlockers`; without it a wall item's clearance walk
            // stops at a ceiling fixture whose plan footprint happens to cross it
            // (the `ceiling2D` surfaces below are walked precisely so that a ceiling
            // TARGET still sees its own group).
            if (isCeilingMountedNode(core, sibling.id) !== targetIsCeiling)
                continue;
            getMatrixWorld(sibling, true, _wallCandidateMatrix);
            projectUnitBoxToBox3(_wallCandidateMatrix, wallInverse, _wallCandidateBox);
            if (_wallCandidateBox.isEmpty())
                continue;
            // Reject candidates whose Z extent falls outside the target's depth
            // zone — they cannot physically conflict with the target's volume.
            if (_wallCandidateBox.min.z > targetDepth)
                continue;
            if (_wallCandidateBox.max.z < -targetDepth)
                continue;
            candidates.push({
                id: sibling.id,
                left: _wallCandidateBox.min.x,
                bottom: _wallCandidateBox.min.y,
                width: _wallCandidateBox.max.x - _wallCandidateBox.min.x,
                height: _wallCandidateBox.max.y - _wallCandidateBox.min.y
            });
        }
    };
    const visitWallFromSegment = (segId) => {
        const seg = getOptionalNode(core, segId);
        if (!seg || seg.type !== NodeType.RoomSegment)
            return;
        const wallId = seg.wall2D.get();
        if (!wallId)
            return;
        const wall = getOptionalNode(core, wallId);
        if (!wall || wall.type !== NodeType.Wall2D)
            return;
        for (const surfaceId of wall.children.get())
            visitMountSurface(surfaceId);
    };
    // Outer boundary — restrict to the target segment + its two topological
    // neighbors (closed loop, so prev/next wrap). A `Set` collapses the
    // 1-/2-segment degenerate path lengths cleanly. If the target segment
    // is not on `path` (e.g. it's on a hole loop), fall back to walking the
    // whole `path` — same correctness as before this optimization, just
    // skipped less in practice.
    const pathIds = room.path.get();
    const targetIdx = pathIds.indexOf(segmentId);
    if (targetIdx >= 0) {
        const n = pathIds.length;
        const prevIdx = (targetIdx - 1 + n) % n;
        const nextIdx = (targetIdx + 1) % n;
        const kept = new Set([pathIds[targetIdx], pathIds[prevIdx], pathIds[nextIdx]]);
        for (const segId of kept)
            visitWallFromSegment(segId);
    }
    else {
        for (const segId of pathIds)
            visitWallFromSegment(segId);
    }
    // Interior hole walls — `holes` is `UUID[][]` (one inner array per hole
    // loop). Walked in full per the optimization scope (path only).
    for (const hole of room.holes.get()) {
        for (const segId of hole)
            visitWallFromSegment(segId);
    }
    // Floor mount planes — skipped outright for a ceiling target (every child is
    // in the other mount group), same short-circuit as the ceiling walk below.
    if (!targetIsCeiling) {
        const floor2D = getOptionalNode(core, room.floor2D.get());
        if (floor2D && floor2D.type === NodeType.Floor2D) {
            for (const surfaceId of floor2D.children.get())
                visitMountSurface(surfaceId);
        }
    }
    // Ceiling mount planes — only ever relevant to a ceiling target.
    if (targetIsCeiling) {
        const ceiling2D = getOptionalNode(core, room.ceiling2D.get());
        if (ceiling2D && ceiling2D.type === NodeType.Ceiling2D) {
            for (const surfaceId of ceiling2D.children.get())
                visitMountSurface(surfaceId);
        }
    }
    return candidates;
};
/**
 * Feeds `compute2DClearances` with the target item's wall-local AABB and
 * every Item in the **same Room** projected into the same wall-local
 * frame — not just items on this one wall. Cross-wall and same-room
 * floor / ceiling items count as blockers as long as their footprint
 * physically reaches the wall plane (see `WALL_STRIP_Z_TOLERANCE`).
 *
 * Up clearance is not produced — the wall's `WallHeight` attribute is
 * not read here because no consumer renders an up dimension yet.
 *
 * Returns `null` when:
 *   - the target item has no `Wall2D` ancestor,
 *   - the parent room cannot be resolved (orphan wall — strict, no
 *     fallback to same-wall scope on purpose),
 *   - the wall length cannot be resolved (degenerate segment).
 *
 * Per repo rule §10 ("design for multiple consumers"), this lives in
 * `designer-core` so `Editor2DUI` and the FloorPlanUI elevation overlay
 * share the exact same math.
 */
const getWallItemClearances = (core, item) => {
    const wall2D = getOptionalParentWall2D(core, item.id);
    if (!wall2D)
        return null;
    const segment = getParentRoomSegment(core, item.id);
    if (!segment)
        return null;
    const room = getOptionalParentRoom(core, item.id);
    if (!room)
        return null;
    const wallLength = computeSegmentLength(core, segment);
    if (!Number.isFinite(wallLength) || wallLength <= 0)
        return null;
    // Target uses the item's own (already wall-local) position + size — its
    // parent is a `MountPlane` / `MountLine` directly under this `Wall2D`,
    // so `position.x/y` and `size.x/y` are wall-local x (along the wall)
    // and y (up the wall). Wall items have rotation `(0,0,0)` from
    // `getMountDefaultRotation` (see comment at lines ~117-121), so the
    // direct read agrees with what `projectUnitBoxToBox3` would produce.
    const target = {
        left: item.position.x.get(),
        bottom: item.position.y.get(),
        width: item.size.x.get(),
        height: item.size.y.get()
    };
    // Pose-only wall world matrix → invert. Scale must be 1 here; only
    // candidate matrices use scale-by-size (so their unit cube expands to
    // the candidate's actual world AABB before being mapped into wall
    // space). Same convention as `getPlanarItemClearances`.
    getMatrixWorld(wall2D, false, _wallMatrix);
    _wallInverse.copy(_wallMatrix).invert();
    const candidates = collectWallItemBlockers(core, item, room, segment.id, _wallInverse);
    return compute2DClearances(target, candidates, { left: 0, right: wallLength, bottom: 0 });
};
/**
 * Inverse of `getWallItemClearances` for a single direction: takes a new
 * gap value (in inches, ≥ 0) and returns a `Command` that repositions the
 * item so the displayed clearance becomes that value.
 *
 * Wall / floor clearances and item-to-item clearances are unified through
 * `setWallItemPosition` from [itemMeasurements.ts](packages/designer-core/src/helpers/itemMeasurements.ts) — the same builder
 * that powers the DetailsPanel "From left wall" / "From right wall" /
 * "From floor" inputs (`apps/mobile-capacitor/.../DetailsPanel/fields/itemFields.ts::applyChange`).
 *
 * Boundary case (clearance to the wall start / wall end / floor) maps
 * 1-to-1 onto a `setWallItemPosition(side, newClearance)` call — this is
 * the panel's path. Item-blocker case translates the gap into an absolute
 * `position.x` / `position.y` and routes it through the same builder via
 * `side='left'` (for left/right horizontal) or `side='floor'` (for down),
 * so wall-bound and item-bound writes share one validation pipeline (val
 * < 0, val + size > wallLength, pinned-side rejection, etc.).
 *
 * Returns `null` when:
 *   - `newClearance < 0`
 *   - the chosen direction is pinned in `resolveItemConstraints`
 *     (delegated to `setWallItemPosition`)
 *   - the resulting position would push the item past the opposite wall
 *     (delegated to `setWallItemPosition`)
 *   - the named blocker can't be resolved (defensive — should not happen
 *     for clearances produced by `getWallItemClearances`)
 *
 * The caller is responsible for wrapping the returned command in a
 * transaction (`runCommandsAsTransaction`) — same contract as
 * `setWallItemPosition` and `setWallItemSize`.
 */
const setWallItemClearance = (core, item, direction, newClearance, clearances) => {
    if (!Number.isFinite(newClearance) || newClearance < 0)
        return null;
    const c = clearances[direction];
    // Boundary case — same call shape as the DetailsPanel "From X" handlers.
    // `WallItemClearanceDirection` and `WallItemSide` are now the same union
    // (`'left' | 'right' | 'down'`) — direct pass-through, no rename.
    if (c.source === 'boundary') {
        return setWallItemPosition(core, item, direction, newClearance);
    }
    const blocker = getOptionalNode(core, c.blockerItemId);
    if (!blocker || blocker.type !== NodeType.Item)
        return null;
    if (direction === 'left') {
        // item.left = blocker.right + newClearance
        const newX = blocker.position.x.get() + blocker.size.x.get() + newClearance;
        return setWallItemPosition(core, item, 'left', newX);
    }
    if (direction === 'right') {
        // item.right = blocker.left − newClearance  ⇒  item.left = blocker.left − size.x − newClearance
        const newX = blocker.position.x.get() - item.size.x.get() - newClearance;
        return setWallItemPosition(core, item, 'left', newX);
    }
    // direction === 'down': item.bottom = blocker.top + newClearance
    const newY = blocker.position.y.get() + blocker.size.y.get() + newClearance;
    return setWallItemPosition(core, item, 'down', newY);
};
// ─── Module-level scratch (hot path — no allocations) ────────────────────────
const _itemMatrix = new Matrix4();
const _itemMatrixInverse = new Matrix4();
const _siblingMatrix = new Matrix4();
const _siblingBox = new Box3();
const _polyPoint3D = new Vector3();
/** MountTypes that this helper supports. Walls have a separate API
 * (`getWallItemClearances`) because their dimension semantics differ. */
const PLANAR_MOUNT_TYPES = new Set([MountType.floor, MountType.ceiling, MountType.countertop]);
/**
 * Slack on the vertical-overlap test, in inches. Two products whose spans meet
 * exactly (a wall cabinet's bottom on a base cabinet's top) do not overlap;
 * this keeps float noise from turning that contact into an overlap.
 */
const VERTICAL_OVERLAP_EPS = 1e-6;
/**
 * Maps the 4 generic `RayClearance2D.source` values from the math layer
 * onto the caller-friendly `PlanarAxisClearance.source` naming used in
 * the clearance UI ("item" / "boundary" / "unbounded").
 */
const toPlanarAxisClearance = (r) => {
    if (r.source === 'aabb') {
        return { distance: r.distance, source: 'item', blockerItemId: r.blockerId };
    }
    if (r.source === 'polygon') {
        return { distance: r.distance, source: 'boundary', blockerItemId: null };
    }
    return { distance: r.distance, source: 'unbounded', blockerItemId: null };
};
/**
 * Collect planar blockers by walking `core.nodeIds` and keeping every
 * **top-level mounted** `NodeType.Item` (parented directly under a
 * `MountPlane` or `MountLine` — not under another `Item` via a
 * `MountPoint`). Each kept sibling contributes its world AABB projected
 * into the target item's local `(X, Z)` frame.
 *
 * Why filter by parent type (instead of "same MountPlane" or just
 * `NodeType.Item`):
 *
 *   - **Includes blockers across mount planes, within one mount group.** A
 *     wall-mounted multiCloset (parent = wall `MountPlane`) MUST block a
 *     floor item's planar dimension that would otherwise pass through it —
 *     the multiCloset's footprint extends into the room and physically
 *     intersects the floor item's clearance ray. Restricting blockers to
 *     the target's own MountPlane (the original rule) silently let
 *     wall / countertop products pass through floor dims and vice versa.
 *     The world-projected footprint already encodes each sibling's full 3D
 *     shape (wall items get their wall rotation baked in via
 *     `getMatrixWorld`), so dropping the Y component gives the correct
 *     (X, Z) blocker.
 *   - **Ceiling is its own group.** Ceiling products obstruct only other
 *     ceiling products, and everything else (floor / countertop / wall /
 *     line) only its own group. On the plan a ceiling light's footprint
 *     overlaps whatever stands beneath it, but nothing on the floor can
 *     ever collide with it — treating that overlap as a blocker stopped a
 *     growing multiCloset dead in open floor, several feet short of the
 *     wall, with the fixture metres above it.
 *   - **Excludes interior / descendant Items.** Composite products
 *     (multiCloset and friends) own internal `NodeType.Item` children
 *     parented under the outer Item via `MountPoint`. Those live INSIDE
 *     the outer AABB and would otherwise produce a `0` clearance on the
 *     matching face — the dim then trips the `edge > 0` UI guard and
 *     silently disappears (the original "missing right multiCloset
 *     dimension" bug). `Item.parent === MountPoint` is therefore
 *     correctly rejected by this filter, even though those children are
 *     themselves `NodeType.Item`.
 *
 * Why iterate `core.nodeIds` instead of reading `parent.children`:
 *
 *   - **Reactivity** — `core.nodeIds.get()` is a signal, so the
 *     surrounding `useComputedValue` re-runs on insert / remove. Each
 *     sibling `getMatrixWorld(node, true)` reads `position` / `rotation`
 *     / `size` / `parent` signals, so the overlay re-runs on any
 *     sibling drag too. (Reading `parent.children` would only re-track
 *     when the children list mutates, missing matrix-only changes on
 *     existing siblings.)
 *   - **No 3D dependency** — works identically with or without an
 *     `AreaDesigner3D` view registered. Headless tests, Node CI, and
 *     standalone FloorPlan-only consumers get the same data without
 *     setting up three.js or wiring an `instanceManager` bridge.
 *
 * Cost is O(N) over `core.nodes` per re-evaluation. For floor-plan
 * scene sizes (10s–low 100s of Items) this is well below the 1ms
 * budget. If much larger scenes start hitting performance, the next
 * step is a spatial index in core (RBush / quadtree keyed on the floor
 * plane), not a 3D bridge.
 */
const collectPlanarItemBlockers = (core, item, itemInverse) => {
    const targetIsCeiling = isCeilingMountedNode(core, item.id);
    // Vertical slab the target actually occupies, in its own local frame: for a
    // planar mount item-local +Y is the height axis, so the target spans
    // `[0, size.y]` and every projected sibling is directly comparable.
    const targetHeight = item.size.y.get();
    const blockers = [];
    for (const id of core.nodeIds.get()) {
        if (id === item.id)
            continue;
        const sibling = getOptionalNode(core, id);
        if (!sibling || sibling.type !== NodeType.Item)
            continue;
        // Top-level mounted product filter — the sibling must be parented
        // directly under a `MountPlane` or `MountLine`. This:
        //   - Includes every top-level product in the scene regardless of
        //     mount type (floor / ceiling / countertop / wall / line) — so a
        //     floor item's clearance correctly stops at a wall-mounted
        //     product whose footprint crosses the ray.
        //   - Excludes interior `NodeType.Item` children parented under
        //     another Item via `MountPoint` (multiCloset panels, drawer
        //     fronts, etc.) — those live INSIDE their parent product's AABB
        //     and would otherwise return a zero clearance and silently hide
        //     the dim.
        const siblingParent = getOptionalNode(core, sibling.parent.get());
        if (!siblingParent)
            continue;
        if (siblingParent.type !== NodeType.MountPlane && siblingParent.type !== NodeType.MountLine)
            continue;
        // Mount-group gate — see `itemMountGroups.ts`.
        if (isCeilingMountedNode(core, sibling.id) !== targetIsCeiling)
            continue;
        getMatrixWorld(sibling, true, _siblingMatrix);
        projectUnitBoxToBox3(_siblingMatrix, itemInverse, _siblingBox);
        if (_siblingBox.isEmpty())
            continue;
        // Vertical slab rejection — the counterpart of the depth slab in
        // `collectWallItemBlockers`, which the planar path never had. Everything
        // below works on the floor-plan projection, so without this a product at
        // ANY height blocks a floor product: a ceiling light eight feet up, a wall
        // cabinet above a base run, a soffit. They cannot touch the target, so
        // they are not blockers. Exactly-touching spans (a wall cabinet whose
        // bottom sits on the target's top) are not an overlap either.
        if (_siblingBox.min.y >= targetHeight - VERTICAL_OVERLAP_EPS)
            continue;
        if (_siblingBox.max.y <= VERTICAL_OVERLAP_EPS)
            continue;
        // `corners` is the TRUE footprint; the AABB fields stay populated as the
        // fallback for a degenerate hull. A sibling rotated relative to this item
        // (the norm once closets sit on different walls) has an AABB far larger
        // than itself, and the ray-cast would stop dead in its empty corners.
        const corners = projectUnitBoxToFootprint2D(_siblingMatrix, itemInverse);
        blockers.push({
            id: sibling.id,
            minX: _siblingBox.min.x,
            maxX: _siblingBox.max.x,
            minZ: _siblingBox.min.z,
            maxZ: _siblingBox.max.z,
            ...(corners.length >= 3 ? { corners } : {})
        });
    }
    return blockers;
};
/**
 * Walk the parent room's polygon and project each segment's `from`
 * point to world `(X, Z)` via `projectNode`, then transform through
 * `itemInverse` → item-local 2D point. Going through `projectNode`
 * (instead of reading `Point.position` directly) means the boundary
 * correctly accounts for any Stage / Floorplan transform — not
 * guaranteed to be identity across apps.
 *
 * The lifted Y component (`0` in world) is dropped: for both floor and
 * ceiling mounts item-local Y is parallel to world Y, so the (X, Z)
 * plane projection is the only one we need for the ray-cast.
 */
const collectRoomPolygonInItemLocal = (core, item, itemInverse) => {
    const polygon = [];
    const room = getOptionalParentRoom(core, item.id);
    if (!room)
        return polygon;
    for (const segId of room.path.get()) {
        const seg = getOptionalNode(core, segId);
        if (!seg || seg.type !== NodeType.RoomSegment)
            continue;
        const fromId = seg.from.get();
        const fromPoint = getOptionalNode(core, fromId);
        if (!fromPoint || fromPoint.type !== NodeType.Point)
            continue;
        const worldXZ = projectNode(core, fromId);
        _polyPoint3D.set(worldXZ.x, 0, worldXZ.y).applyMatrix4(itemInverse);
        polygon.push({ x: _polyPoint3D.x, z: _polyPoint3D.z });
    }
    return polygon;
};
/**
 * Resolves item-local radial clearances for a single Item parented under
 * a planar MountPlane (floor / ceiling / countertop). For each of the 4
 * cardinal item-local directions (±X, ±Z) returns the distance from the
 * item's CENTER to the first hit — either a same-MountPlane sibling Item
 * or a room boundary edge.
 *
 * Architecture:
 *
 *   1. **Blocker collection** — `collectPlanarItemBlockers` walks
 *      `core.nodeIds`, keeps every `NodeType.Item` whose parent is a
 *      `MountPlane` or `MountLine` (i.e. every top-level mounted
 *      product in the scene, regardless of mount type — floor, ceiling,
 *      countertop, wall, or line), and projects each kept sibling's 8
 *      unit-cube corners through `siblingMatrix × itemInverse` →
 *      item-local AABB on (X, Z). Pure scene-graph walk, no view
 *      dependency — same data is available with or without an
 *      `AreaDesigner3D` mounted. The parent-type filter is what makes
 *      composite products (multiCloset and friends) report sane
 *      clearances despite owning interior `NodeType.Item` children
 *      (those are parented via `MountPoint`, not Mount{Plane,Line}, and
 *      are correctly rejected); it also lets a floor item's planar dim
 *      be blocked by a wall-mounted product whose footprint extends
 *      into the room.
 *   2. **Boundary collection** — pure scene-graph walk over `Room.path`,
 *      projecting `from` points through `projectNode` then through
 *      `itemInverse` → item-local 2D points.
 *   3. **Ray-cast** — pure 2D math via `raycastClearances2D` from
 *      `helpers/math/plane/`.
 *
 * Why item-local space: the dimension overlay rotates with the product
 * (item-local axes align with the badges in the FloorPlan overlay).
 * Doing the projection here keeps the data ready-to-use and avoids
 * re-deriving the item rotation in the consumer.
 *
 * Returns `null` when:
 *   - The item's parent is not a `MountPlane`.
 *   - The mount slot type is not in `PLANAR_MOUNT_TYPES` (e.g. wall, line).
 *   - `size.x` or `size.z` is non-positive.
 */
const getPlanarItemClearances = (core, item) => {
    const parent = getOptionalNode(core, item.parent.get());
    if (!parent || parent.type !== NodeType.MountPlane)
        return null;
    const slotType = parent.mountSlotTypes.get()[0];
    if (!PLANAR_MOUNT_TYPES.has(slotType))
        return null;
    const sx = item.size.x.get();
    const sz = item.size.z.get();
    if (!(sx > 0) || !(sz > 0))
        return null;
    // Pose-only item world matrix → invert. We DON'T scale by item size:
    // the inverse must map world points into the item's [0..size]^3 box,
    // not the unit cube. (Sibling matrices DO use scale — their corners are
    // (0..1)^3 expanded by their own size, then projected back into this
    // pose-only space.)
    getMatrixWorld(item, false, _itemMatrix);
    _itemMatrixInverse.copy(_itemMatrix).invert();
    const blockers = collectPlanarItemBlockers(core, item, _itemMatrixInverse);
    const polygonInItemLocal = collectRoomPolygonInItemLocal(core, item, _itemMatrixInverse);
    const r = raycastClearances2D(sx / 2, sz / 2, blockers, polygonInItemLocal);
    return {
        left: toPlanarAxisClearance(r.xMinus),
        right: toPlanarAxisClearance(r.xPlus),
        front: toPlanarAxisClearance(r.zMinus),
        back: toPlanarAxisClearance(r.zPlus)
    };
};
// ---------------------------------------------------------------------------
// Inverse — write a new planar clearance back to the item position
// ---------------------------------------------------------------------------
// Module-level scratch for the inverse path (`setPlanarItemClearance`). The
// write side runs synchronously inside a user-input event handler, so it
// never overlaps the read-side `useComputedValue` re-runs that own
// `_polyPoint3D` / `_siblingBox` further up in this module — but we still
// give it dedicated objects to keep the lifetimes obviously disjoint.
const _writeEuler = new Euler();
const _writeQuat = new Quaternion();
const _writeDelta = new Vector3();
const OPPOSITE_PLANAR_DIR = {
    left: 'right',
    right: 'left',
    front: 'back',
    back: 'front'
};
/**
 * Inverse of `getPlanarItemClearances` for a single direction. Takes the
 * NEW edge-to-hit clearance value the user typed (in inches, ≥ 0) and
 * returns a `Command` that repositions the item so the displayed
 * clearance becomes that value.
 *
 * Display vs. raw distance:
 *
 *   `getPlanarItemClearances` returns center-to-hit distances; the
 *   `Product` overlay subtracts `halfX` / `halfZ` to render an
 *   edge-to-hit value (the same geometric quantity the user sees on
 *   screen). `setPlanarItemClearance` accepts that **edge-to-hit** value
 *   so the round-trip "what I read" ⇄ "what I write" stays trivial — the
 *   helper rebuilds the matching center-to-hit number internally.
 *
 * Math (per direction `D`):
 *
 *   - Pick the matching half-extent: `halfX` for `left`/`right` (the
 *     X-axis pair), `halfZ` for `front`/`back` (the Z-axis pair).
 *   - `oldDisplay = clearances[D].distance − halfExtent` (the value the
 *     overlay was showing when the user opened the input).
 *   - The HIT POINT is fixed in world (it's a sibling Item or a room
 *     polygon edge — neither moves as a side-effect of this write), so
 *     to make the edge-to-hit gap equal `newClearance`, the item center
 *     must shift along its OWN local axis by:
 *
 *         delta_item_local = (oldDisplay − newClearance)  (with sign)
 *
 *     Sign per direction (item-local `+X = right`, `+Z = back`):
 *
 *         right (+X) :  +Δ along +X   (Δ = oldDisplay − newClearance)
 *         left  (−X) :  −Δ along +X
 *         back  (+Z) :  +Δ along +Z
 *         front (−Z) :  −Δ along +Z
 *
 *     So enlarging the clearance (`newClearance > oldDisplay`) gives a
 *     negative Δ, which moves the item AWAY from the hit on every
 *     direction — exactly what the user expects when they type a
 *     bigger number.
 *   - Convert the (X, Z) item-local delta to MOUNT-local via the item's
 *     own rotation (Euler → Quaternion → `applyQuaternion`). For
 *     ceiling items this correctly accounts for the `R_x(π)` flip that
 *     mirrors item-local `+Z` relative to mount-local `+Z`. The
 *     rotated delta lands on (mount X, mount Y) — both in-plane axes
 *     for floor / ceiling MountPlanes — for the standard
 *     `item.rotation.x = π/2` orientation that lets item-local (X, Z)
 *     match the world floor plane after the chain.
 *   - Position write keeps `position.z` unchanged. Mount-local +Z is
 *     the surface NORMAL for floor / ceiling MountPlanes (mount +X / +Y
 *     are the two horizontal in-plane axes — see the rotation chain in
 *     `getMatrixWorld` for `Floorplan(R_x(-π/2))` × `Ceiling2D(R_x(π))`
 *     × `MountPlane(I)`). Pinning Z keeps the item on the mount surface;
 *     X and Y absorb the rotated delta. The earlier `position.y` pin
 *     was a sign error left over from world-axis intuition and silently
 *     dropped the in-plane delta whenever `R_item × (0, 0, dz)` landed
 *     on mount Y (i.e. every standard front / back edit).
 *
 * Validation (returns `null`):
 *   - `newClearance < 0` or `!Number.isFinite(newClearance)`.
 *   - The chosen direction's clearance is `'unbounded'` (no anchor).
 *   - Same axis as the chosen direction has the OPPOSITE direction
 *     also finite, and `newClearance > oldDisplay + oppositeDisplay` —
 *     i.e. the edit would push the item past the opposing blocker /
 *     polygon edge on the same axis. Same shape as the wall version's
 *     "past-wall" rejection in `setWallItemPosition`.
 *   - `deltaDisplay === 0` (no-op edit, e.g. user confirmed the
 *     existing value unchanged).
 *
 * The caller is responsible for wrapping the returned command in a
 * transaction (`runCommandsAsTransaction`) — same contract as
 * `setWallItemClearance` and `setWallItemPosition`.
 *
 * Both `'item'` and `'boundary'` blockers go through the SAME write
 * path (unlike the wall version which routes boundaries through
 * `setWallItemPosition`): for planar items the math depends only on
 * the center-to-hit distance, not on the blocker's identity, so the
 * single `SetNodeVector3Command(item, position, …)` is sufficient.
 */
const setPlanarItemClearance = (core, item, direction, newClearance, clearances) => {
    if (!Number.isFinite(newClearance) || newClearance < 0)
        return null;
    const c = clearances[direction];
    if (c.source === 'unbounded')
        return null;
    if (!Number.isFinite(c.distance))
        return null;
    const isHorizontal = direction === 'left' || direction === 'right';
    const halfExtent = isHorizontal ? item.size.x.get() / 2 : item.size.z.get() / 2;
    if (!(halfExtent >= 0))
        return null;
    const oldDisplay = c.distance - halfExtent;
    // Past-opposite-blocker guard — both clearances on the same axis
    // bracket the available range. Skip when the opposite ray is
    // unbounded (degenerate room) — no anchor on that side.
    const opposite = clearances[OPPOSITE_PLANAR_DIR[direction]];
    if (opposite.source !== 'unbounded' && Number.isFinite(opposite.distance)) {
        const oppositeDisplay = opposite.distance - halfExtent;
        if (newClearance > oldDisplay + oppositeDisplay)
            return null;
    }
    const deltaDisplay = oldDisplay - newClearance;
    if (deltaDisplay === 0)
        return null;
    let dxLocal = 0;
    let dzLocal = 0;
    if (direction === 'right')
        dxLocal = deltaDisplay;
    else if (direction === 'left')
        dxLocal = -deltaDisplay;
    else if (direction === 'back')
        dzLocal = deltaDisplay;
    else
        dzLocal = -deltaDisplay; // 'front'
    // Rotate the item-local delta into MOUNT-local via the item's own
    // rotation. `item.position` lives in mount-local, so the delta we add
    // must too.
    _writeEuler.set(item.rotation.x.get(), item.rotation.y.get(), item.rotation.z.get());
    _writeQuat.setFromEuler(_writeEuler);
    _writeDelta.set(dxLocal, 0, dzLocal).applyQuaternion(_writeQuat);
    // Mount-normal pin: in moon-designer, mount-local +Z is the surface
    // normal for floor / ceiling MountPlanes (mount +X and +Y are the two
    // in-plane horizontal axes — see `getMatrixWorld` chain). Items resting
    // on the surface have `position.z ≈ 0` and the user-typed clearance
    // edits must move them ALONG the surface (X / Y), never through it.
    // The previous `y: oldPos.y` pin was wrong: it discarded half of the
    // possible in-plane delta — specifically the Y component that
    // `R_item × (0, 0, dz)` produces for items with `item.rotation.x = π/2`
    // (the standard "lying on the surface" rotation), which is why the
    // `front`/`back` edits silently no-op'd while `left`/`right` (whose
    // delta is purely along mount +X) worked.
    const newPosition = {
        x: item.position.x.get() + _writeDelta.x,
        y: item.position.y.get() + _writeDelta.y,
        z: item.position.z.get() // pinned — mount normal stays unchanged
    };
    return new SetNodeVector3Command(item.id, VectorProps.position, newPosition);
};
// ---------------------------------------------------------------------------
// Fit-to-size — grow an item to fill the free width along its local X axis
// ---------------------------------------------------------------------------
// Module-level scratch for the reposition delta (`fitItemToSizeX`). Mirrors
// the `_writeEuler` / `_writeQuat` / `_writeDelta` trio above — the write
// runs synchronously inside a user-input handler, so its lifetime never
// overlaps the read-side scratch further up the module, but it gets its own
// objects to keep ownership obviously disjoint.
const _fitEuler = new Euler();
const _fitQuat = new Quaternion();
const _fitDelta = new Vector3();
/**
 * Left / right EDGE-to-obstacle gaps (inches, `>= 0`) along the item's
 * local X axis, with the same "nearest obstacle" semantics — and the same
 * wall-end / room-polygon boundary — as the on-screen product dimensions.
 *
 * Single seam over the two existing clearance getters, dispatched by mount
 * surface in one shot:
 *
 *   1. The item's direct parent must be a `MountPlane` or `MountLine` —
 *      this is what excludes interior items parented via `MountPoint`
 *      (composite-product internals like multiCloset panels). Without this
 *      guard, a wall-mounted multiCloset's inner panel would route to the
 *      wall path with non-wall-local `position` coordinates and produce
 *      garbage clearances.
 *   2. `getOptionalParentWall2D` then discriminates wall vs. planar:
 *        - Wall ancestor present → `getWallItemClearances` (already
 *          returns EDGE gaps in wall-local x, used as-is).
 *        - No wall ancestor → `getPlanarItemClearances` (returns
 *          CENTER-to-hit along item-local ±X, so we subtract `size.x / 2`
 *          to get the edge gap).
 *
 * Returns `null` when:
 *   - `size.x <= 0`,
 *   - the item is not parented under a `MountPlane` / `MountLine`,
 *   - the active branch can't resolve a finite clearance, or
 *   - the planar branch reports an `'unbounded'` side (item outside the
 *     room polygon with no sibling hit) — no anchor to measure against.
 */
const getItemLocalXClearances = (core, item) => {
    const sx = item.size.x.get();
    if (!(sx > 0))
        return null;
    const parent = getOptionalNode(core, item.parent.get());
    if (!parent)
        return null;
    if (parent.type !== NodeType.MountPlane && parent.type !== NodeType.MountLine)
        return null;
    const wall2D = getOptionalParentWall2D(core, item.id);
    if (wall2D) {
        const wallClearances = getWallItemClearances(core, item);
        if (!wallClearances)
            return null;
        return {
            left: Math.max(0, wallClearances.left.distance),
            right: Math.max(0, wallClearances.right.distance)
        };
    }
    const planar = getPlanarItemClearances(core, item);
    if (!planar)
        return null;
    if (planar.left.source === 'unbounded' || planar.right.source === 'unbounded')
        return null;
    const halfX = sx / 2;
    return {
        left: Math.max(0, planar.left.distance - halfX),
        right: Math.max(0, planar.right.distance - halfX)
    };
};
/**
 * "Fit to size" along the item's local X axis: grow the item to fill the
 * whole free span between its nearest left and right obstacles (sibling
 * products AND the wall-end / room boundary) and slide it so its left edge
 * abuts the left obstacle.
 *
 * Geometry (all in the item's own local frame, origin at the local `[0..size]`
 * box corner):
 *   - `left` / `right` are the edge-to-obstacle gaps from
 *     `getItemLocalXClearances` (identical to the displayed dimensions).
 *   - `newWidth = size.x + left + right` — the left obstacle to the right
 *     obstacle.
 *   - The left edge moves to the left obstacle, i.e. the local origin shifts
 *     by `-left` along local +X. That delta is rotated into the PARENT
 *     (mount-local) frame by the item's own rotation and added to
 *     `position`. For wall items rotation is `(0,0,0)` → identity → only
 *     `position.x` changes (consistent with the wall-local edge semantics of
 *     `getWallItemClearances`); for floor / ceiling items the `R_x(π/2)`
 *     keeps the shift in the mount plane, same basis as
 *     `setPlanarItemClearance`.
 *
 * Returns the `[size, position]` command pair (caller wraps in
 * `runCommandsAsTransaction` for one undo step) — or `null` when:
 *   - `size.x <= 0`,
 *   - neither clearance getter applies / a side is unbounded,
 *   - the result would be a no-op (`left === 0 && right === 0`) or a
 *     non-positive width.
 */
const fitItemToSizeX = (core, item) => {
    const sx = item.size.x.get();
    const sy = item.size.y.get();
    const sz = item.size.z.get();
    if (!(sx > 0))
        return null;
    const clearances = getItemLocalXClearances(core, item);
    if (!clearances)
        return null;
    const { left, right } = clearances;
    if (!Number.isFinite(left) || !Number.isFinite(right))
        return null;
    if (left === 0 && right === 0)
        return null;
    const newWidth = sx + left + right;
    if (!(newWidth > 0))
        return null;
    // Rotate the `-left` local-X shift into the parent (mount-local) frame.
    _fitEuler.set(item.rotation.x.get(), item.rotation.y.get(), item.rotation.z.get());
    _fitQuat.setFromEuler(_fitEuler);
    _fitDelta.set(-left, 0, 0).applyQuaternion(_fitQuat);
    const newPosition = {
        x: item.position.x.get() + _fitDelta.x,
        y: item.position.y.get() + _fitDelta.y,
        z: item.position.z.get() + _fitDelta.z
    };
    return [
        new SetNodeVector3Command(item.id, VectorProps.size, { x: newWidth, y: sy, z: sz }),
        new SetNodeVector3Command(item.id, VectorProps.position, newPosition)
    ];
};

export { VERTICAL_OVERLAP_EPS, compute2DClearances, fitItemToSizeX, getItemLocalXClearances, getPlanarItemClearances, getWallItemClearances, setPlanarItemClearance, setWallItemClearance };
