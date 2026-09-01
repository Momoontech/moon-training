import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
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
import getStage from '../components/Node/helpers/getStage.js';
import getNode from '../components/Node/helpers/getNode.js';
import { getMonitor } from './monitor.js';
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
import '../components/Node/helpers/getSelectableNode.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

const getRoomSegmentsByPoint = (core, pointId) => {
    // During dispose the root subtree is removed before reactive consumers
    // (e.g. AnglesUI's useComputedValue) finish unsubscribing, so the stage /
    // point ids can briefly point at nodes that no longer exist. Bail out
    // silently in that case rather than throwing & logging on every frame.
    const stageId = core.currentStage.get();
    if (!stageId || !core.nodes.get(stageId) || !core.nodes.get(pointId))
        return [];
    try {
        const segments = [];
        const stage = getStage(core, stageId);
        const stageSegments = stage.segments.get();
        for (const segmentId of stageSegments) {
            const segment = getNode(core, segmentId);
            if (segment.type !== NodeType.RoomSegment)
                continue;
            if (segment.from.get() === pointId || segment.to.get() === pointId) {
                segments.push(segmentId);
            }
        }
        return segments;
    }
    catch (error) {
        getMonitor().debug('Error getting room segments by point', error);
        return [];
    }
};

export { getRoomSegmentsByPoint as default };
