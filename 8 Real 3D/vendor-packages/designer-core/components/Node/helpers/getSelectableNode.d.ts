import { Node } from '..';
import { NodeType } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
/**
 * Node types that exist ONLY in the floor plan and have no editor2D / editor3D
 * counterpart, so a selection of one cannot survive a switch into those modes.
 *
 * A corner `Point` is the case this exists for: the floor plan draws it as a
 * draggable vertex (`FloorPlanUI/RoomPointsUI`) and its angle badge
 * (`AnglesUI`), but the 3D scene has nothing to outline for it — the wall
 * meshes meeting at the corner belong to the adjacent `RoomSegment`s. Switching
 * to editor2D / editor3D therefore CLEARS the selection instead of leaving a
 * selected-but-invisible node behind (see `clearSelectionWithoutSceneCounterpartEffect`
 * in `designer-core.ts`).
 *
 * A `RoomSegment` is deliberately NOT here: it maps to its `Wall2D` in the 3D
 * scene, which is exactly what {@link getSelectableNode} folds the two into —
 * see `resolveWall2DSelection`. Its counterpart is CONDITIONAL though (walls are
 * not selectable on every mobile step), so it is decided per mode + step by
 * {@link hasUprightViewCounterpart} rather than by this flat list.
 */
export declare const floorPlanOnlySelectableNodeTypes: NodeType[];
/**
 * Types the editor3D / editor2D parent-chain walk accepts as a HIT target.
 *
 * These lists are **pre-fold**: they answer "what can a raycast resolve to",
 * not "what ends up in `selectedNodeId`". `NodeType.Wall2D` is listed because a
 * wall IS a legitimate tap target, but {@link getSelectableNode} then folds it
 * onto its `RoomSegment` (see `resolveWall2DSelection`), so the SELECTION is
 * never a `Wall2D`. Keep that distinction in mind when reading a type off one of
 * these lists: `editor3DSelectableNodeTypes.includes(NodeType.Wall2D)` is true,
 * yet `getSelectableNode(...)?.type === NodeType.Wall2D` never is.
 */
export declare const editor3DSelectableNodeTypes: NodeType[];
/**
 * Mobile `Design`-step subset of {@link editor3DSelectableNodeTypes}: everything EXCEPT
 * `Wall2D`. A wall is a measure-time target — selecting it only feeds the wall length /
 * height badges (`Editor3DUI/WallDimensionsUI`) — so while designing it would just swallow
 * taps meant for the products standing in front of it.
 *
 * The web target has no steps and keeps the full list (see the non-mobile branch below).
 * `Editor2DUI` resolves its wall from `core.editor2DBaseNodeId`, not from `selectedNodeId`,
 * so the 2D front-elevation editor is unaffected by this exclusion.
 */
export declare const designStepSelectableNodeTypes: NodeType[];
/**
 * Mobile `Measure`-step selectable types. `Room` is reached by walking up from a floor hit
 * (`Floor2D` → `Room`); `Wall2D` is hit directly and drives the wall-dimensions overlay.
 *
 * Panels / Models / mount planes are not raycastable in this step (see
 * `updateRaycastLayerEffect` in designer3d), so the upward walk cannot reach a `Wall2D`
 * through a wall-mounted product — a wall only resolves from an actual wall hit.
 *
 * Pre-fold, like {@link editor3DSelectableNodeTypes}: the wall hit resolves to the wall's
 * `RoomSegment`, and `Editor3DUI` reads the wall back off `segment.wall2D` to place the
 * length / height badges.
 */
export declare const measureStepSelectableNodeTypes: NodeType[];
/**
 * The node a raycast hit should select in the CURRENT view mode — the canonical
 * "what does this tap select" resolver used by designer3d's `Handler`.
 *
 * Two stages: the per-mode parent-chain walk ({@link resolveSelectableNode}),
 * then the view-independent {@link resolveWall2DSelection} fold that turns a
 * `Wall2D` into its `RoomSegment`. A `Wall2D` is therefore NEVER the selected
 * node — walls and their floor-plan segments share ONE selection.
 */
export declare const getSelectableNode: (core: CoreDesigner, node: Node) => Node | undefined;
/**
 * Whether `node` — the CURRENT selection — still has something selectable behind it
 * in the UPRIGHT views (editor2D / editor3D). Drives
 * `clearSelectionWithoutSceneCounterpartEffect` (`designer-core.ts`): a selection
 * with no counterpart there is dropped on entering those modes instead of lingering
 * invisibly with a floor-plan-only toolbar attached.
 *
 * **Precondition: `core.generalViewMode` is already `editor2D` / `editor3D`.** The
 * `RoomSegment` branch probes the live resolver, which is per-mode.
 *
 * Three answers:
 *  - {@link floorPlanOnlySelectableNodeTypes} (a corner `Point`) → never a counterpart.
 *  - `RoomSegment` → its `Wall2D`, but ONLY where a wall is selectable at all. Rather
 *    than re-deriving the mode × step matrix (and drifting from it), this asks the real
 *    resolver the question the user's finger would: "would a tap on this wall select
 *    THIS segment here?" So it is `true` on web and on the mobile Measure step
 *    (`measureStepSelectableNodeTypes` has `Wall2D`), and `false` on the mobile design
 *    steps — `designStepSelectableNodeTypes` deliberately drops `Wall2D` so a wall
 *    cannot swallow taps meant for the products in front of it, which means a wall
 *    selection carried in from the floor plan has nothing to stand on there. Also
 *    `false` for a segment with no wall yet (arc / bezier).
 *  - anything else (Item, Part, Room, Floor2D, …) → assumed to have one; those types
 *    render in both views and are not part of this invariant.
 */
export declare const hasUprightViewCounterpart: (core: CoreDesigner, node: Node) => boolean;
