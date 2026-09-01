import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import { CoreMode } from '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
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
import getNode from '../components/Node/helpers/getNode.js';
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
import getNodesBySystem from '../components/Node/helpers/getNodesBySystem.js';
import '../components/Node/helpers/getSelectableNode.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

const CoreSignals = {
    currentStageId: (core) => core.currentStage.get(),
    generalViewMode: (core) => core.generalViewMode.get(),
    editor2DBaseNodeId: (core) => core.editor2DBaseNodeId.get(),
    floorPlanDrawMode: (core) => core.floorPlanDrawMode.get(),
    selectedNodeId: (core) => core.selectedNodeId.get(),
    // selectedRoomId: (core: CoreDesigner) => core.selectedRoomId.get(),
    selectedNodeType: (core) => {
        const nodeId = core.selectedNodeId.get();
        if (nodeId) {
            return getOptionalNode(core, nodeId)?.type ?? null;
        }
        return null;
    },
    draggedNodeId: (core) => core.draggedNodeId.get(),
    draggedNodeType: (core) => {
        const nodeId = core.draggedNodeId.get();
        if (nodeId) {
            return getNode(core, nodeId).type;
        }
        return null;
    },
    hoveredNodeId: (core) => core.hoveredNodeId.get(),
    hoveredNodeType: (core) => {
        const nodeId = core.hoveredNodeId.get();
        if (nodeId) {
            return getNode(core, nodeId).type;
        }
        return null;
    },
    step: (core) => core.projectSettings.coreMode === CoreMode.mobile ? core.projectSettings.mobileSettings.step.get() : null,
    catalogDragPath: (core) => core.draggedCatalogPath.get(),
    hasPages: (core) => Object.keys(core.paperSpace.pages.get()).length > 0,
    hasSystems: (core) => core.systemData.get().some(({ id }) => getNodesBySystem(core, id).length > 0)
};

export { CoreSignals as default };
