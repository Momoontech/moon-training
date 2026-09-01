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
import getPoint from '../components/Node/helpers/getPoint.js';
import getRoomSegment from '../components/Node/helpers/getRoomSegment.js';
import '../components/Node/helpers/getSelectableNode.js';
import { Vector2 } from './math/Vector2.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

/**
 * Builds the ordered 2D polygon of a room by walking its segment path
 * (Room.path -> RoomSegment.from -> Point.position).
 *
 * Room segments are stored with a consistent `from` -> `to` orientation
 * (normalized by `normilezeSegmentsClosePath` when the room is created), so
 * pushing `from` of each segment in path order yields the full closed polygon.
 */
const getRoomPolygon = (core, roomId) => {
    const room = getRoom(core, roomId);
    const segmentIds = room.path.get();
    const polygon = [];
    for (const segmentId of segmentIds) {
        const segment = getRoomSegment(core, segmentId);
        const fromPoint = getPoint(core, segment.from.get());
        polygon.push(new Vector2(fromPoint.position.x.get(), fromPoint.position.y.get()));
    }
    return polygon;
};

export { getRoomPolygon as default };
