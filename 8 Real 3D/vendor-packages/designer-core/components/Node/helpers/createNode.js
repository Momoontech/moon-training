import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import { ModelType } from '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import { SegmentType } from '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import { AdjustableBox } from '../components/AdjustableBox/index.js';
import { AdjustableExtrusion } from '../components/AdjustableExtrusion/index.js';
import { BoxContainer } from '../components/BoxContainer/index.js';
import { Carcass } from '../components/Carcass/index.js';
import { Ceiling2D } from '../components/Ceiling2D/index.js';
import { Countertop } from '../components/Countertop/index.js';
import { CrownMolding } from '../components/CrownMolding/index.js';
import { Edgebanding } from '../components/Edgebanding/index.js';
import { Floor2D } from '../components/Floor2D/index.js';
import { Floorplan } from '../components/Floorplan/index.js';
import { Frame } from '../components/Frame/index.js';
import { FreeBoxContainer } from '../components/FreeBoxContainer/index.js';
import { GateFrame } from '../components/GateFrame/index.js';
import { Glass } from '../components/Glass/index.js';
import { Image } from '../components/Image/index.js';
import { Item } from '../components/Item/index.js';
import { LaminateBox } from '../components/LaminateBox/index.js';
import { MiteredPanel } from '../components/MiteredPanel/index.js';
import { ApplianceModel } from '../components/Model/ApplianceModel.js';
import { HingeModel } from '../components/Model/HingeModel.js';
import { OtherModel } from '../components/Model/OtherModel.js';
import { createMolding } from '../components/Molding/index.js';
import { MountLine } from '../components/MountLine/index.js';
import { MountPlane } from '../components/MountPlane/index.js';
import { MountPoint } from '../components/MountPoint/index.js';
import { Panel } from '../components/Panel/index.js';
import { Part } from '../components/Part/index.js';
import { Point } from '../components/Point/index.js';
import { PointLight } from '../components/PointLight/index.js';
import { RawPanel } from '../components/RawPanel/index.js';
import { Room } from '../components/Room/index.js';
import { ArcRoomSegment } from '../components/RoomSegment/ArcRoomSegment.js';
import { BezierRoomSegment } from '../components/RoomSegment/BezierRoomSegment.js';
import { LinearRoomSegment } from '../components/RoomSegment/LinearRoomSegment.js';
import { ShapedBoxContainer } from '../components/ShapedBoxContainer/index.js';
import { SpotLight } from '../components/SpotLight/index.js';
import { Stage } from '../components/Stage/index.js';
import { Tiles } from '../components/Tiles/index.js';
import { ToeKickPanel } from '../components/ToeKickPanel/index.js';
import { Valance } from '../components/Valance/index.js';
import { Wall2D } from '../components/Wall2D/index.js';
import { WindowFrame } from '../components/WindowFrame/index.js';

// Built on first call, never at module scope. This module is one end of an import cycle
// (Node/index.ts pulls in createNode, and createNode pulls in all ~38 node classes, several
// of which reach back here through barrels), so whichever end the bundler evaluates first
// decides whether these class bindings are initialized. Reading them in an object literal at
// module scope crashed with "Cannot access 'Item' before initialization"; reading them on the
// first createNode() call is always after every module in the cycle has finished evaluating.
// Memoised, so command-heavy paths (project load creates a node per config) don't re-allocate.
const buildNodes = () => ({
    [NodeType.Floorplan]: Floorplan,
    [NodeType.Item]: Item,
    [NodeType.Part]: Part,
    [NodeType.Panel]: Panel,
    [NodeType.Edgebanding]: Edgebanding,
    [NodeType.Stage]: Stage,
    [NodeType.Wall2D]: Wall2D,
    [NodeType.Floor2D]: Floor2D,
    [NodeType.Ceiling2D]: Ceiling2D,
    [NodeType.Point]: Point,
    [NodeType.Room]: Room,
    [NodeType.AdjustableBox]: AdjustableBox,
    [NodeType.AdjustableExtrusion]: AdjustableExtrusion,
    [NodeType.BoxContainer]: BoxContainer,
    [NodeType.Carcass]: Carcass,
    [NodeType.Countertop]: Countertop,
    [NodeType.CrownMolding]: CrownMolding,
    [NodeType.Frame]: Frame,
    [NodeType.FreeBoxContainer]: FreeBoxContainer,
    [NodeType.GateFrame]: GateFrame,
    [NodeType.Glass]: Glass,
    [NodeType.Image]: Image,
    [NodeType.LaminateBox]: LaminateBox,
    [NodeType.MiteredPanel]: MiteredPanel,
    [NodeType.MountPoint]: MountPoint,
    [NodeType.MountPlane]: MountPlane,
    [NodeType.MountLine]: MountLine,
    // NodeType.Molding is handled by createMolding below (dispatches on moldingType)
    [NodeType.PointLight]: PointLight,
    [NodeType.RawPanel]: RawPanel,
    [NodeType.ShapedBoxContainer]: ShapedBoxContainer,
    [NodeType.SpotLight]: SpotLight,
    [NodeType.Tiles]: Tiles,
    [NodeType.ToeKickPanel]: ToeKickPanel,
    [NodeType.Valance]: Valance,
    [NodeType.WindowFrame]: WindowFrame
});
let nodes;
const getNodes = () => (nodes ??= buildNodes());
const createNode = (config, core) => {
    if (config.type === NodeType.Model) {
        switch (config.modelType) {
            case ModelType.applianceModel:
                return new ApplianceModel(config, core);
            case ModelType.hinge:
                return new HingeModel(config, core);
            default:
                return new OtherModel(config, core);
        }
    }
    if (config.type === NodeType.Molding) {
        return createMolding(config, core);
    }
    if (config.type === NodeType.RoomSegment) {
        switch (config.segmentType) {
            case SegmentType.linear:
                return new LinearRoomSegment(config, core);
            case SegmentType.arc:
                return new ArcRoomSegment(config, core);
            default:
                return new BezierRoomSegment(config, core);
        }
    }
    const Constructor = getNodes()[config.type];
    if (!Constructor)
        throw new Error(`Unknown node type: ${config.type}`);
    // @ts-ignore
    return new Constructor(config, core);
};

export { createNode as default };
