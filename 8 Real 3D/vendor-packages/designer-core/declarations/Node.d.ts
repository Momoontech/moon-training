import { AdjustableBoxCatalogConfig, AdjustableBoxConfig } from './AdjustableBox';
import { AdjustableExtrusionCatalogConfig, AdjustableExtrusionConfig } from './AdjustableExtrusion';
import { IAttributes } from './Attributes';
import { BoxContainerCatalogConfig, BoxContainerConfig } from './BoxContainer';
import { CarcassCatalogConfig, CarcassConfig } from './Carcass';
import { Ceiling2DCatalogConfig, Ceiling2DConfig } from './Ceiling2D';
import { UUID } from './core';
import { CountertopCatalogConfig, CountertopConfig } from './Countertop';
import { CrownMoldingCatalogConfig, CrownMoldingConfig } from './CrownMolding';
import { EdgebandingCatalogConfig, EdgebandingConfig } from './Edgebanding';
import { Floor2DCatalogConfig, Floor2DConfig } from './Floor2D';
import { FloorplanCatalogConfig, FloorplanConfig } from './Floorplan';
import { FrameCatalogConfig, FrameConfig } from './Frame';
import { FreeBoxContainerCatalogConfig, FreeBoxContainerConfig } from './FreeBoxContainer';
import { GateFrameCatalogConfig, GateFrameConfig } from './GateFrame';
import { GlassCatalogConfig, GlassConfig } from './Glass';
import { ImageCatalogConfig, ImageConfig } from './Image';
import { ItemCatalogConfig, ItemConfig } from './Item';
import { IValue } from './IValue';
import { LaminateBoxCatalogConfig, LaminateBoxConfig } from './LaminateBox';
import { MiteredPanelCatalogConfig, MiteredPanelConfig } from './MiteredPanel';
import { ModelCatalogConfig, ModelConfig } from './Model';
import { MoldingCatalogConfig, MoldingConfig } from './Molding';
import { MountLineConfig } from './MountLine';
import { MountPlaneCatalogConfig, MountPlaneConfig } from './MountPlane';
import { MountPointCatalogConfig, MountPointConfig } from './MountPoint';
import { PanelCatalogConfig, PanelConfig } from './Panel';
import { PartCatalogConfig, PartConfig } from './Part';
import { PointCatalogConfig, PointConfig } from './Point';
import { PointLightCatalogConfig, PointLightConfig } from './PointLight';
import { RawPanelCatalogConfig, RawPanelConfig } from './RawPanel';
import { RoomCatalogConfig, RoomConfig } from './Room';
import { RoomSegmentCatalogConfig, RoomSegmentConfig } from './Segment';
import { ShapedBoxContainerCatalogConfig, ShapedBoxContainerConfig } from './ShapedBoxContainer';
import { SpotLightCatalogConfig, SpotLightConfig } from './SpotLight';
import { StageCatalogConfig, StageConfig } from './Stage';
import { TilesCatalogConfig, TilesConfig } from './Tiles';
import { ToeKickPanelCatalogConfig, ToeKickPanelConfig } from './ToeKickPanel';
import { ValanceCatalogConfig, ValanceConfig } from './Valance';
import { Wall2DCatalogConfig, Wall2DConfig } from './Wall2D';
import { WindowFrameCatalogConfig, WindowFrameConfig } from './WindowFrame';
export declare enum NodeType {
    Floorplan = "Floorplan",
    Item = "Item",
    Panel = "Panel",
    Part = "Part",
    Edgebanding = "Edgebanding",
    AdjustableBox = "AdjustableBox",
    AdjustableExtrusion = "AdjustableExtrusion",
    BoxContainer = "BoxContainer",
    Carcass = "Carcass",
    Countertop = "Countertop",
    CrownMolding = "CrownMolding",
    Frame = "Frame",
    FreeBoxContainer = "FreeBoxContainer",
    GateFrame = "GateFrame",
    Glass = "Glass",
    Image = "Image",
    LaminateBox = "LaminateBox",
    MiteredPanel = "MiteredPanel",
    Model = "Model",
    Molding = "Molding",
    PointLight = "PointLight",
    RawPanel = "RawPanel",
    ShapedBoxContainer = "ShapedBoxContainer",
    SpotLight = "SpotLight",
    Tiles = "Tiles",
    ToeKickPanel = "ToeKickPanel",
    Valance = "Valance",
    WindowFrame = "WindowFrame",
    MountPoint = "MountPoint",
    MountPlane = "MountPlane",
    MountLine = "MountLine",
    Room = "Room",
    Stage = "Stage",
    Point = "Point",
    RoomSegment = "RoomSegment",
    Wall2D = "Wall2D",
    Floor2D = "Floor2D",
    Ceiling2D = "Ceiling2D"
}
export type NodeSharedConfig = {
    uuid: UUID;
    parent: UUID | null;
    exists?: IValue<number>;
    attributes?: IAttributes;
    name?: string;
    MVName?: string;
    comment?: string;
};
export type NodeConfig = ItemConfig | PartConfig | PanelConfig | EdgebandingConfig | FloorplanConfig | StageConfig | PointConfig | RoomSegmentConfig | RoomConfig | Wall2DConfig | Floor2DConfig | Ceiling2DConfig | AdjustableBoxConfig | AdjustableExtrusionConfig | BoxContainerConfig | CarcassConfig | CountertopConfig | CrownMoldingConfig | FrameConfig | FreeBoxContainerConfig | GateFrameConfig | GlassConfig | ImageConfig | LaminateBoxConfig | MiteredPanelConfig | ModelConfig | MoldingConfig | MountPointConfig | MountPlaneConfig | MountLineConfig | PointLightConfig | RawPanelConfig | ShapedBoxContainerConfig | SpotLightConfig | TilesConfig | ToeKickPanelConfig | ValanceConfig | WindowFrameConfig;
export type NodeCatalogConfig = ItemCatalogConfig | PartCatalogConfig | PanelCatalogConfig | EdgebandingCatalogConfig | FloorplanCatalogConfig | StageCatalogConfig | PointCatalogConfig | RoomSegmentCatalogConfig | RoomCatalogConfig | Wall2DCatalogConfig | Floor2DCatalogConfig | Ceiling2DCatalogConfig | AdjustableBoxCatalogConfig | AdjustableExtrusionCatalogConfig | BoxContainerCatalogConfig | CarcassCatalogConfig | CountertopCatalogConfig | CrownMoldingCatalogConfig | FrameCatalogConfig | FreeBoxContainerCatalogConfig | GateFrameCatalogConfig | GlassCatalogConfig | ImageCatalogConfig | LaminateBoxCatalogConfig | MiteredPanelCatalogConfig | ModelCatalogConfig | MoldingCatalogConfig | MountPointCatalogConfig | MountPlaneCatalogConfig | PointLightCatalogConfig | RawPanelCatalogConfig | ShapedBoxContainerCatalogConfig | SpotLightCatalogConfig | TilesCatalogConfig | ToeKickPanelCatalogConfig | ValanceCatalogConfig | WindowFrameCatalogConfig;
export type PartialNodeCatalogConfig<T extends NodeCatalogConfig = NodeCatalogConfig> = Partial<T> & {
    source: IValue<string> | IValue<string>[];
};
