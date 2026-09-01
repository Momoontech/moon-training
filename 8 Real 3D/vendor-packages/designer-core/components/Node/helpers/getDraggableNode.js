import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import { GeneralViewMode, CoreMode, MobileStep } from '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import { FreeBoxContainerType } from '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import { PartType } from '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import getPropertyValue from '../../../helpers/getPropertyValue.js';
import { isMultiClosetStackPartType } from '../../../helpers/multiCloset/contentPartTypes.js';
import getOptionalNode from './getOptionalNode.js';
import getOptionalParentItem from './getOptionalParentItem.js';
import { getEffectiveContentLocked } from './getResizableSides.js';

const getDraggableNode = (core, node, event) => {
    const mode = core.generalViewMode.get();
    let result = node;
    const selectedNodeId = core.selectedNodeId.get();
    switch (mode) {
        case GeneralViewMode.floorPlan:
            {
                if (core.projectSettings.coreMode === CoreMode.mobile &&
                    [MobileStep.Architecture, MobileStep.Systems, MobileStep.Catalog].includes(core.projectSettings.mobileSettings.step.get())) {
                    while (result) {
                        const nodeType = result.type;
                        const parent = getOptionalNode(core, result.parent.get());
                        // The lock cascade: a locked section pins its WHOLE subtree — neither the section
                        // nor anything inside it may drag, and the walk must not fall through to dragging
                        // the parent multiCloset. Stop the walk here (→ the branch's terminal
                        // `return undefined`). Scoped to real drags via `event.type !== 'contextmenu'` so
                        // context menu / selection paths are untouched. Same predicate the resize oracle
                        // uses, so drag and handles freeze and revive together.
                        // Gated on SELECTION deliberately (drill-down drag model): an UNSELECTED section —
                        // locked or not — is never dragged as a section; grabbing it drags the parent
                        // closet, which the lock does not forbid (the closet moves the locked section
                        // rigidly, its internal design intact). Only a SELECTED locked node refuses.
                        if (nodeType === NodeType.Part &&
                            selectedNodeId === result.id &&
                            event.type !== 'contextmenu' &&
                            getEffectiveContentLocked(core, result.id)) {
                            break;
                        }
                        if ((nodeType === NodeType.Item && !getOptionalParentItem(core, result.id)) ||
                            (nodeType === NodeType.Part &&
                                ((result.partType.get() === PartType.multiClosetSection &&
                                    selectedNodeId === result.id &&
                                    event.type !== 'contextmenu') ||
                                    (result.partType.get() === PartType.multiClosetSectionContent &&
                                        selectedNodeId === result.parent.get() &&
                                        event.type === 'contextmenu')))) {
                            return result;
                        }
                        result = parent;
                    }
                }
            }
            return undefined;
        case GeneralViewMode.editor2D:
        case GeneralViewMode.editor3D:
            {
                if (core.projectSettings.coreMode === CoreMode.mobile &&
                    [MobileStep.Present, MobileStep.Customize, MobileStep.Estimate, MobileStep.Accessorize].includes(core.projectSettings.mobileSettings.step.get()))
                    return undefined;
                while (result) {
                    const nodeType = result.type;
                    const item = getOptionalParentItem(core, result.id);
                    const parent = getOptionalNode(core, result.parent.get());
                    // The lock cascade in the 3D editor too: a locked section pins its whole subtree
                    // (section, stacks, openings) — stop the walk so nothing inside drags nor falls
                    // through to the parent multiCloset. Same gate as the floorPlan branch, including
                    // the deliberate SELECTION scope: an unselected section (locked or not) drags the
                    // parent closet — a rigid move the lock does not forbid.
                    if (nodeType === NodeType.Part &&
                        selectedNodeId === result.id &&
                        event.type !== 'contextmenu' &&
                        getEffectiveContentLocked(core, result.id)) {
                        break;
                    }
                    if (
                    // (nodeType === NodeType.Molding && (result as Molding).moldingType.get() === MoldingType.hangingRail) ||
                    (nodeType === NodeType.Part &&
                        isMultiClosetStackPartType(result.partType.get()) &&
                        selectedNodeId === result.id &&
                        parent &&
                        parent.type === NodeType.FreeBoxContainer &&
                        parent.freeBoxContainerType.get() === FreeBoxContainerType.multiCloset) ||
                        (nodeType === NodeType.Part &&
                            parent &&
                            parent.type === NodeType.FreeBoxContainer &&
                            !parent.freeBoxContainerType.get() &&
                            item &&
                            !getPropertyValue(item, 'freePartsNonSelectable')) ||
                        (nodeType === NodeType.Part &&
                            ([
                                PartType.ladderPart,
                                PartType.soffitPart,
                                PartType.toeKickPart,
                                PartType.bottomValancePart,
                                PartType.countertopPart
                            ].includes(result.partType.get()) ||
                                (result.partType.get() === PartType.multiClosetSection &&
                                    selectedNodeId === result.id &&
                                    event.type !== 'contextmenu') ||
                                (result.partType.get() === PartType.multiClosetSectionContent &&
                                    selectedNodeId === result.parent.get() &&
                                    event.type === 'contextmenu'))) ||
                        (nodeType === NodeType.Item && !getOptionalParentItem(core, result.id))
                    // || (parent && parent.type === NodeType.Floorplan)
                    ) {
                        return result;
                    }
                    result = parent;
                }
            }
            return undefined;
        default:
            return undefined;
    }
};

export { getDraggableNode };
