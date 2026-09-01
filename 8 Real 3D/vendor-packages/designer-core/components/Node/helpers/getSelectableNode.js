import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import { GeneralViewMode, CoreMode, MobileStep } from '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import { FreeBoxContainerType } from '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import { MoldingType } from '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import { isMultiClosetJointPartType, PartType, MultiClosetComponentType } from '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import { isMultiClosetStackPartType, isMultiClosetItemPartType, getCategoryForItemPartType } from '../../../helpers/multiCloset/contentPartTypes.js';
import { isMultiClosetShelfBoard } from '../../../helpers/multiCloset/isMultiClosetShelfBoard.js';
import getOptionalNode from './getOptionalNode.js';
import getOptionalParentItem from './getOptionalParentItem.js';

/**
 * The multiCloset `Part`s the user may select once "drilled into" a closet:
 * the section panels AND the joint parts (both sides, all variants). Gated the
 * same way as sections — see the `selectedNodeId === item.id || …` checks below.
 *
 * Used by the **floorplan** branches. The **editor3D** branches use the stricter
 * `isSelectableMultiClosetChainNode` drill-down (Item → Section → Stack → Single Part).
 */
const isSelectableMultiClosetPart = (part) => {
    const partType = part.partType.get();
    return partType === PartType.multiClosetSection || isMultiClosetJointPartType(partType);
};
/**
 * Walk up from `node` to the id of its enclosing multiCloset Section `Part`
 * (`partType === multiClosetSection`), skipping the content / carcass / box /
 * FreeBoxContainer wrappers in between. Returns `undefined` if there is none.
 */
const getMultiClosetSectionAncestorId = (core, node) => {
    let current = getOptionalNode(core, node.parent.get());
    while (current) {
        if (current.type === NodeType.Part && current.partType.get() === PartType.multiClosetSection) {
            return current.id;
        }
        current = getOptionalNode(core, current.parent.get());
    }
    return undefined;
};
/** Count the multiCloset item parts (the leaf openings) directly held by a stack. */
const countStackItemParts = (core, stackId) => {
    const stack = getOptionalNode(core, stackId);
    if (!stack || stack.type !== NodeType.Part)
        return 0;
    return stack.children.get().reduce((count, id) => {
        const child = getOptionalNode(core, id);
        return child?.type === NodeType.Part && isMultiClosetItemPartType(child.partType.get())
            ? count + 1
            : count;
    }, 0);
};
/**
 * Strict, parent-scoped multiCloset selection chain (editor3D):
 * Item → Section → Stack → Single Part. Returns whether `part` is the drill
 * target for the current `selectedNodeId`. Joint parts are NOT part of this
 * chain — the caller keeps a separate clause for them.
 */
const isSelectableMultiClosetChainNode = (core, part, selectedNodeId) => {
    const partType = part.partType.get();
    // Item → Section: a section is selectable only while its Item is selected.
    if (partType === PartType.multiClosetSection) {
        const item = getOptionalParentItem(core, part.id);
        return !!item && item.id === selectedNodeId;
    }
    // Section → Stack: a stack is selectable only while its enclosing section is selected.
    if (isMultiClosetStackPartType(partType)) {
        return getMultiClosetSectionAncestorId(core, part) === selectedNodeId;
    }
    // Stack → Single Part: an item part is selectable only while its parent stack is selected — EXCEPT:
    //  - drawers: the single drawer fills the stack, so the stack is the terminal level (never the drawer);
    //  - shelves: the empty COMPARTMENT is not the selection target — the adjustable shelf BOARD is (below);
    //  - hangers: a LONE hanger fills its stack (same as a drawer) → not selectable, the stack stays the
    //    terminal level; only when the stack holds MORE than one hanger is each individual hanger selectable.
    if (isMultiClosetItemPartType(partType)) {
        const category = getCategoryForItemPartType(part);
        if (category === MultiClosetComponentType.multiClosetDrawerPart ||
            category === MultiClosetComponentType.multiClosetShelfPart)
            return false;
        if (countStackItemParts(core, part.parent.get()) <= 1)
            return false;
        return part.parent.get() === selectedNodeId;
    }
    // Stack → Board: the adjustable shelf board (a `freeBoxContainerInteriorPart` whose parent is a
    // SHELVES stack) is the terminal drill target for shelves — selectable while its stack is selected.
    // Bay dividers (parent = FreeBoxContainer) and drawer/hanger dividers (non-shelves stack) are not.
    if (isMultiClosetShelfBoard(core, part)) {
        return part.parent.get() === selectedNodeId;
    }
    return false;
};
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
const floorPlanOnlySelectableNodeTypes = [NodeType.Point];
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
const editor3DSelectableNodeTypes = [
    // NodeType.Item,
    NodeType.Countertop,
    NodeType.CrownMolding,
    NodeType.ToeKickPanel,
    NodeType.Valance,
    NodeType.Ceiling2D,
    NodeType.Floor2D,
    NodeType.Wall2D
];
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
const designStepSelectableNodeTypes = editor3DSelectableNodeTypes.filter((nodeType) => ![NodeType.Wall2D, NodeType.Floor2D].includes(nodeType));
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
const measureStepSelectableNodeTypes = [NodeType.Room, NodeType.Wall2D];
/**
 * Fold a `Wall2D` hit onto its floor-plan `RoomSegment`.
 *
 * A wall IS the editor2D / editor3D representation of a segment
 * (`Wall2DConfig.parent` is that segment id), so the two must never be two
 * competing selections. `selectedNodeId` therefore always holds the **segment**,
 * and each view highlights its own representation of it:
 *   - floorPlan  → the SVG wall line (`FloorPlanUI/RoomSegmentsUI` gates on
 *     `selectedNodeId === segmentId`),
 *   - editor2D / editor3D → the `Wall2DView` mesh outline (resolved from
 *     `segment.wall2D` in designer3d's `changeSelectedObjectEffect`).
 *
 * That is what makes a wall selection survive a mode switch in BOTH directions
 * without any per-mode selection bookkeeping. Falls back to the wall itself if
 * the parent segment is gone (a torn-down subtree mid-transaction).
 */
const resolveWall2DSelection = (core, node) => node.type === NodeType.Wall2D ? (getOptionalNode(core, node.parent.get()) ?? node) : node;
/** Per-mode / per-step walk up the parent chain to the first selectable ancestor. */
const resolveSelectableNode = (core, node) => {
    const mode = core.generalViewMode.get();
    let result = node;
    const selectedNodeId = core.selectedNodeId.get();
    switch (mode) {
        case GeneralViewMode.floorPlan:
            {
                if (core.projectSettings.coreMode === CoreMode.mobile) {
                    switch (core.projectSettings.mobileSettings.step.get()) {
                        case MobileStep.Architecture:
                        case MobileStep.Systems:
                        case MobileStep.Catalog:
                            while (result) {
                                const nodeType = result.type;
                                const parent = getOptionalNode(core, result.parent.get());
                                const item = getOptionalParentItem(core, result.id);
                                if ((nodeType === NodeType.Item && !getOptionalParentItem(core, result.id)) ||
                                    (nodeType === NodeType.Part &&
                                        item &&
                                        selectedNodeId &&
                                        (selectedNodeId === item.id || item.sections.get().includes(selectedNodeId)) &&
                                        isSelectableMultiClosetPart(result)) ||
                                    nodeType === NodeType.Room) {
                                    return result;
                                }
                                result = parent;
                            }
                            return undefined;
                        case MobileStep.Floorplan:
                            while (result) {
                                const nodeType = result.type;
                                const parent = getOptionalNode(core, result.parent.get());
                                if (nodeType === NodeType.Room) {
                                    return result;
                                }
                                result = parent;
                            }
                            return undefined;
                        case MobileStep.Present:
                        case MobileStep.Estimate:
                        case MobileStep.Customize:
                        case MobileStep.Accessorize:
                            return undefined;
                    }
                }
                else {
                    while (result) {
                        const nodeType = result.type;
                        const parent = getOptionalNode(core, result.parent.get());
                        const item = getOptionalParentItem(core, result.id);
                        if ((nodeType === NodeType.Item && !getOptionalParentItem(core, result.id)) ||
                            (nodeType === NodeType.Part &&
                                item &&
                                selectedNodeId &&
                                (selectedNodeId === item.id || item.sections.get().includes(selectedNodeId)) &&
                                isSelectableMultiClosetPart(result)) ||
                            nodeType === NodeType.Room) {
                            return result;
                        }
                        result = parent;
                    }
                }
                // while (result) {
                //   const nodeType = result.type;
                //   const parent = getNode(core, result.parent.get());
                //   if (nodeType === NodeType.Room) {
                //     return result;
                //   }
                //   result = parent;
                // }
            }
            return undefined;
        // editor2D is the same 3D scene through an ortho front camera — same canvas,
        // same raycast, same node tree. Selection is camera-agnostic, so it shares the
        // editor3D drill-down (Item → Section → Stack → Single Part, joints, etc.)
        // rather than a bespoke case.
        case GeneralViewMode.editor2D:
        case GeneralViewMode.editor3D:
            {
                if (core.projectSettings.coreMode === CoreMode.mobile) {
                    switch (core.projectSettings.mobileSettings.step.get()) {
                        case MobileStep.Architecture:
                        case MobileStep.Systems:
                        case MobileStep.Catalog:
                            while (result) {
                                const nodeType = result.type;
                                const item = getOptionalParentItem(core, result.id);
                                const parent = getOptionalNode(core, result.parent.get());
                                if ((nodeType === NodeType.Molding &&
                                    result.moldingType.get() === MoldingType.hangingRail) ||
                                    (nodeType === NodeType.Part &&
                                        parent &&
                                        parent.type === NodeType.FreeBoxContainer &&
                                        parent.freeBoxContainerType.get() !== FreeBoxContainerType.multiCloset &&
                                        item &&
                                        !item.properties.get('freePartsNonSelectable')) ||
                                    (nodeType === NodeType.Part &&
                                        [
                                            PartType.ladderPart,
                                            PartType.soffitPart,
                                            PartType.toeKickPart,
                                            PartType.bottomValancePart,
                                            PartType.countertopPart
                                        ].includes(result.partType.get())) ||
                                    (nodeType === NodeType.Part &&
                                        isMultiClosetJointPartType(result.partType.get()) &&
                                        item &&
                                        selectedNodeId &&
                                        (selectedNodeId === item.id || item.sections.get().includes(selectedNodeId))) ||
                                    (nodeType === NodeType.Part &&
                                        selectedNodeId &&
                                        isSelectableMultiClosetChainNode(core, result, selectedNodeId)) ||
                                    designStepSelectableNodeTypes.includes(nodeType) ||
                                    (nodeType === NodeType.Item && !getOptionalParentItem(core, result.id))
                                // || (parent && parent.type === NodeType.Floorplan)
                                ) {
                                    return result;
                                }
                                result = parent;
                            }
                            return undefined;
                        case MobileStep.Floorplan:
                            while (result) {
                                const nodeType = result.type;
                                const parent = getOptionalNode(core, result.parent.get());
                                if (measureStepSelectableNodeTypes.includes(nodeType)) {
                                    return result;
                                }
                                result = parent;
                            }
                            return undefined;
                        case MobileStep.Present:
                        case MobileStep.Estimate:
                        case MobileStep.Customize:
                        case MobileStep.Accessorize:
                            while (result) {
                                const nodeType = result.type;
                                const item = getOptionalParentItem(core, result.id);
                                const parent = getOptionalNode(core, result.parent.get());
                                if (
                                // (nodeType === NodeType.Molding &&
                                //   (result as Molding).moldingType.get() === MoldingType.hangingRail) ||
                                // (nodeType === NodeType.Part &&
                                //   parent &&
                                //   parent.type === NodeType.FreeBoxContainer &&
                                //   item &&
                                //   !item.properties.get('freePartsNonSelectable')) ||
                                (nodeType === NodeType.Part &&
                                    isMultiClosetJointPartType(result.partType.get()) &&
                                    item &&
                                    selectedNodeId &&
                                    (selectedNodeId === item.id || item.sections.get().includes(selectedNodeId))) ||
                                    (nodeType === NodeType.Part &&
                                        selectedNodeId &&
                                        isSelectableMultiClosetChainNode(core, result, selectedNodeId)) ||
                                    // editor3DSelectableNodeTypes.includes(nodeType) ||
                                    (nodeType === NodeType.Item && !getOptionalParentItem(core, result.id))
                                // || (parent && parent.type === NodeType.Floorplan)
                                ) {
                                    return result;
                                }
                                result = parent;
                            }
                            return undefined;
                    }
                }
                else {
                    while (result) {
                        const nodeType = result.type;
                        const item = getOptionalParentItem(core, result.id);
                        const parent = getOptionalNode(core, result.parent.get());
                        if ((nodeType === NodeType.Molding && result.moldingType.get() === MoldingType.hangingRail) ||
                            (nodeType === NodeType.Part &&
                                parent &&
                                parent.type === NodeType.FreeBoxContainer &&
                                parent.freeBoxContainerType.get() !== FreeBoxContainerType.multiCloset &&
                                item &&
                                !item.properties.get('freePartsNonSelectable')) ||
                            (nodeType === NodeType.Part &&
                                [
                                    PartType.ladderPart,
                                    PartType.soffitPart,
                                    PartType.toeKickPart,
                                    PartType.bottomValancePart,
                                    PartType.countertopPart
                                ].includes(result.partType.get())) ||
                            (nodeType === NodeType.Part &&
                                isMultiClosetJointPartType(result.partType.get()) &&
                                item &&
                                selectedNodeId &&
                                (selectedNodeId === item.id || item.sections.get().includes(selectedNodeId))) ||
                            (nodeType === NodeType.Part &&
                                selectedNodeId &&
                                isSelectableMultiClosetChainNode(core, result, selectedNodeId)) ||
                            editor3DSelectableNodeTypes.includes(nodeType) ||
                            (nodeType === NodeType.Item && !getOptionalParentItem(core, result.id))
                        // || (parent && parent.type === NodeType.Floorplan)
                        ) {
                            return result;
                        }
                        result = parent;
                    }
                }
            }
            return undefined;
        default:
            return undefined;
    }
};
/**
 * The node a raycast hit should select in the CURRENT view mode — the canonical
 * "what does this tap select" resolver used by designer3d's `Handler`.
 *
 * Two stages: the per-mode parent-chain walk ({@link resolveSelectableNode}),
 * then the view-independent {@link resolveWall2DSelection} fold that turns a
 * `Wall2D` into its `RoomSegment`. A `Wall2D` is therefore NEVER the selected
 * node — walls and their floor-plan segments share ONE selection.
 */
const getSelectableNode = (core, node) => {
    const selectable = resolveSelectableNode(core, node);
    return selectable && resolveWall2DSelection(core, selectable);
};
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
const hasUprightViewCounterpart = (core, node) => {
    if (floorPlanOnlySelectableNodeTypes.includes(node.type))
        return false;
    if (node.type !== NodeType.RoomSegment)
        return true;
    const wall2DId = node.wall2D.get();
    const wall = wall2DId ? getOptionalNode(core, wall2DId) : undefined;
    return !!wall && getSelectableNode(core, wall)?.id === node.id;
};

export { designStepSelectableNodeTypes, editor3DSelectableNodeTypes, floorPlanOnlySelectableNodeTypes, getSelectableNode, hasUprightViewCounterpart, measureStepSelectableNodeTypes };
