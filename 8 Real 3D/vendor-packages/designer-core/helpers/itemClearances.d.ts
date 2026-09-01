import { Item } from '../components/Node/components/Item';
import { Command } from '../components/commands/core/Command';
import { UUID } from '../declarations';
import { CoreDesigner } from '../designer-core';
/**
 * One axis-aligned clearance from an item edge to the nearest blocker:
 * either another wall item (`'item'`) or the wall/floor boundary
 * (`'boundary'`). `distance` is the gap in inches and is always `>= 0`.
 */
export interface AxisClearance {
    distance: number;
    source: 'item' | 'boundary';
    blockerItemId: UUID | null;
}
/**
 * Three clearances around a wall-mounted item, expressed in wall-local 2D
 * (x along wall length from the segment "from" point, y measuring height
 * above the floor):
 *   - `left`  : gap from `item.left`   to nearest left-side neighbor / wall start
 *   - `right` : gap from `item.right`  to nearest right-side neighbor / wall end
 *   - `down`  : gap from `item.bottom` to nearest item below / floor
 *
 * Up clearance (to ceiling / item above) is intentionally not computed yet
 * — the planned UI does not display it. Add it as a sibling field when the
 * design needs it; the algorithm mirror is trivial.
 */
export interface WallItemClearances {
    left: AxisClearance;
    right: AxisClearance;
    down: AxisClearance;
    bounds: ClearanceBounds;
}
/**
 * Wall-local AABB with explicit `id`. Inputs to `compute2DClearances` are
 * deliberately plain numbers (no `Item` / `Vector3`) so the same helper can
 * back FloorPlanUI's elevation overlay later — see `getFloorItemClearances`
 * (planned, not in this PR).
 */
export interface ClearanceRect {
    id: UUID;
    /** Left edge in wall-local x (inches from segment "from"). */
    left: number;
    /** Bottom edge in wall-local y (inches above floor). */
    bottom: number;
    width: number;
    height: number;
}
/**
 * 2D wall-local bounds for clearance fallback. `top` is intentionally
 * omitted — `up` clearance is not yet rendered. Fill it in when needed.
 */
export interface ClearanceBounds {
    /** Left wall end, always 0 in wall-local coords. */
    left: number;
    /** Right wall end (= wall length). */
    right: number;
    /** Floor, always 0 in wall-local coords. */
    bottom: number;
}
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
export declare const compute2DClearances: (target: Omit<ClearanceRect, "id">, candidates: ReadonlyArray<ClearanceRect>, bounds: ClearanceBounds) => WallItemClearances;
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
export declare const getWallItemClearances: (core: CoreDesigner, item: Item) => WallItemClearances | null;
/**
 * One of the three editable clearance directions in the Editor2D overlay.
 * Maps the visual orientation (left/right/down) to the underlying axis
 * mutation; up clearance is intentionally absent — see `WallItemClearances`.
 */
export type WallItemClearanceDirection = 'left' | 'right' | 'down';
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
export declare const setWallItemClearance: (core: CoreDesigner, item: Item, direction: WallItemClearanceDirection, newClearance: number, clearances: WallItemClearances) => Command | null;
/**
 * One radial clearance ray from the item's center, in **item-local axes**:
 *   - `right` : ray in item-local +X
 *   - `left`  : ray in item-local −X
 *   - `back`  : ray in item-local +Z
 *   - `front` : ray in item-local −Z
 *
 * `distance` is the full ray length in inches FROM THE ITEM CENTER until
 * the first hit (always `≥ 0`). The hit can be a sibling Item on the same
 * MountPlane (`source: 'item'`, `blockerItemId` set) or a room boundary
 * edge (`source: 'boundary'`, `blockerItemId: null`). When the item is
 * outside the room polygon (degenerate geometry — e.g. mid-drag) and no
 * sibling is hit, the ray is `'unbounded'` (`distance: Infinity`).
 *
 * Item-local axes mean these directions ROTATE WITH THE PRODUCT — a sofa
 * turned 30° has its "right" still pointing along its own width axis, not
 * along the room's X axis. The UI overlay applies the matching matrix
 * transform on its wrapper, so the badges stay perpendicular to the item.
 *
 * This is the public surface for clearance overlays. Internally we map
 * `PlanarAxisClearance` ↔ the lower-level `RayClearance2D` from
 * `helpers/math/plane/raycastClearances2D` 1:1 (`'aabb'` → `'item'`,
 * `'polygon'` → `'boundary'`); the math helper stays generic, this type
 * keeps the caller-friendly naming.
 */
export interface PlanarAxisClearance {
    distance: number;
    source: 'item' | 'boundary' | 'unbounded';
    blockerItemId: UUID | null;
}
export interface PlanarItemClearances {
    left: PlanarAxisClearance;
    right: PlanarAxisClearance;
    front: PlanarAxisClearance;
    back: PlanarAxisClearance;
}
/** Direction of a single planar clearance — see `PlanarItemClearances`. */
export type PlanarClearanceDirection = 'left' | 'right' | 'front' | 'back';
/**
 * Slack on the vertical-overlap test, in inches. Two products whose spans meet
 * exactly (a wall cabinet's bottom on a base cabinet's top) do not overlap;
 * this keeps float noise from turning that contact into an overlap.
 */
export declare const VERTICAL_OVERLAP_EPS = 0.000001;
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
export declare const getPlanarItemClearances: (core: CoreDesigner, item: Item) => PlanarItemClearances | null;
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
export declare const setPlanarItemClearance: (core: CoreDesigner, item: Item, direction: PlanarClearanceDirection, newClearance: number, clearances: PlanarItemClearances) => Command | null;
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
export declare const getItemLocalXClearances: (core: CoreDesigner, item: Item) => {
    left: number;
    right: number;
} | null;
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
export declare const fitItemToSizeX: (core: CoreDesigner, item: Item) => Command[] | null;
