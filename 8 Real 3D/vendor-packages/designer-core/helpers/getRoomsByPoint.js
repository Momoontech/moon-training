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
import getRoomSegment from '../components/Node/helpers/getRoomSegment.js';
import '../components/Node/helpers/getSelectableNode.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

/**
 * Returns every room on the current stage whose polygon walks through the
 * given point id. Rooms are detected by scanning each room's `path` (segment
 * ids) and checking whether any segment references `pointId` as its `from`
 * or `to` endpoint.
 *
 * Used when dragging an existing corner: the dragged point's own rooms must
 * be excluded from collision tests — otherwise the point's own polygon would
 * immediately reject every candidate position.
 */
const getRoomsByPoint = (core, pointId) => {
    const stageId = core.currentStage.get();
    const stage = getStage(core, stageId);
    const stageRooms = stage.rooms.get();
    const rooms = [];
    for (const roomId of stageRooms) {
        const room = getRoom(core, roomId);
        const path = room.path.get();
        for (const segmentId of path) {
            const segment = getRoomSegment(core, segmentId);
            if (segment.from.get() === pointId || segment.to.get() === pointId) {
                rooms.push(roomId);
                break;
            }
        }
    }
    return rooms;
};

export { getRoomsByPoint as default };
