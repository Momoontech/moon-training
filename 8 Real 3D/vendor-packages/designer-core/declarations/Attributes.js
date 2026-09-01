import { V3Axes } from './InterpretedLine.js';
import { materialsSetKeys } from './ProjectSettings.js';

const InterpretedLineConstantDefaultValue = ['0'];
const InterpretedLineOperatorDefaultValue = ['0'];
const INodePropertyNamesValues = ['name', 'MVName', 'comment'];
const IProductAttributeNamesValues = [
    'ProductAttribute1',
    'ProductAttribute2',
    'ProductAttribute3',
    'FixedDepth',
    'FrontPosition',
    'InsetShelf',
    'FaceFrameWidth',
    // Door product attributes (see `IDoorOpenTypeValues` & co. in `declarations/helpers.ts`
    // for the value enums). Set on door products / parts in the catalog; consumed via
    // `productAttribute` / `attribute` formula tokens and the product-details panel.
    'DoorOpenType',
    'DoorType',
    'DoorOpenDirection',
    'DoorOpenSide'
];
const IProductPropertyNamesValues = [
    ...INodePropertyNamesValues,
    'isFinishEnd',
    'catalogPath',
    'isFiller',
    // Excludes the item (and its whole subtree) from calculation output. Set on
    // serialized configs (e.g. built-in ceiling lights); seeded here so it
    // survives load and round-trips like the other product flags. Read by the
    // calculation layer (`collectNodeCalculations`).
    'HideInCalculation',
    'isSingleCloset',
    'isMultiCloset',
    // Marks a closet-shelf product. Vesta gated one perPart qualification branch
    // on it; seeded here so it round-trips, though no core producer sets it yet
    // (the branch effectively relies on `parent is Carcass` until a source lands).
    'isClosetShelf',
    'freePartsNonSelectable',
    // Adjacent multiCloset on each side, recomputed by the designer3d
    // `updateMultiClosetNeighborsEffect` on drag-end. Stored as product properties
    // (not bespoke fields) so `productProperty` formula tokens can read them.
    // `Left/RightMultiClosetNeighborId` hold the side-to-side / side-to-front
    // neighbor; `Left/RightJointMultiClosetNeighborId` hold the reverse link
    // written onto the neighbor when the connection is side-to-front (perpendicular).
    'LeftMultiClosetNeighborId',
    'RightMultiClosetNeighborId',
    'LeftJointMultiClosetNeighborId',
    'RightJointMultiClosetNeighborId',
    'itemNumber'
];
const IPartPropertyNamesValues = [
    ...INodePropertyNamesValues,
    'HideInCalculation',
    'catalogPath',
    'PanelPresent',
    // The multiCloset section lock, written by the toolbar lock button and read by the whole lock
    // cascade (`getEffectiveContentLocked`, the resize oracle, the drag gates, the width input).
    // Seeded here — as `RoomSegment` already seeds its own `isLocked` — so a read is a plain Map
    // lookup: `getPropertyValue` no longer has to CREATE the Value on first access, which happened
    // once per sibling inside tracked computeds and forced callers to "materialise before grabbing
    // the reference" before handing it to a command.
    'isLocked'
];
const IPointPropertyNamesValues = ['isLocked', 'isAngleLocked'];
const IRoomSegmentPropertyNamesValues = [...INodePropertyNamesValues, 'isLocked'];
// Cross-cutting metadata carried in serialized node configs (Item, Model,
// SpotLight, Carcass, Panel, …) but historically dropped on load. `INodePropertyNamesValues`
// is spread into the front of each per-type property-name list below, so the keys
// ride along when that node seeds its `properties` Map (via `withProperties` or a
// hand-rolled loop) and round-trip through the same `SetNodePropertyValueCommand`
// channel as the type-specific names. `BaseNode` itself seeds nothing.
const IBoxContainerPropertyNamesValues = [...INodePropertyNamesValues, 'shelfShape'];
const ICarcassAttributeNamesValues = ['CarcassAttribute1', 'CarcassAttribute2', 'CarcassAttribute3'];
const IPartAttributeNamesValues = ['PartAttribute1', 'PartAttribute2', 'PartAttribute3'];
const IPanelAttributeNamesValues = ['PanelAttribute1', 'PanelAttribute2', 'PanelAttribute3'];
const IRoomAttributeNamesValues = [
    'RoomAttribute1',
    'RoomAttribute2',
    'RoomAttribute3',
    'CeilingType',
    'DecoMoldingPresent',
    'DecoMoldingHeight',
    'BaseboardPresent',
    'BaseboardHeight',
    'BaseboardDepth',
    'BaseWallPoints',
    'CeilingWallPoints',
    'WallHeight',
    'returnWall'
];
const IPanelProperyNamesValues = [...INodePropertyNamesValues, 'PanelProperty1'];
const IModelProperyNamesValues = [
    ...INodePropertyNamesValues,
    'isScalable',
    'isPositioned',
    'isSizable'
];
const ICountertopAttributeNamesValues = [
    'CountertopAttribute1',
    'CountertopAttribute2',
    'CountertopAttribute3',
    'CountertopThickness'
];
const IAttributeNamesValues = [
    ...IProductAttributeNamesValues,
    ...ICarcassAttributeNamesValues,
    ...IPartAttributeNamesValues,
    ...IPanelAttributeNamesValues,
    ...ICountertopAttributeNamesValues,
    ...IRoomAttributeNamesValues
];
// @TODO IProjectAttributeNames, IMaterialsSetMaterialAttributeS, IMaterialsSetMaterialAttributeN
// string is separated from number because "2"+"2" = "22"
const IProjectAttributeNamesValues = ['placeholder', 'MultiClosetsJointType'];
const IMaterialsSetMaterialAttributeSValues = ['placeholder'];
const IMaterialsSetMaterialAttributeNValues = ['placeholder'];
const IMaterialsSetStyleAttributeSValues = ['placeholder'];
const IMaterialsSetStyleAttributeNValues = ['placeholder'];
const IMaterialsSetAttributeValueValues = ['placeholder'];
const IBoxContainerAttributeNamesValues = [];
const ICrownMoldingAttributeNamesValues = [];
const IEdgebandingAttributeNamesValues = [];
const IFrameAttributeNamesValues = [];
const IGateFrameAttributeNamesValues = [];
const IGlassAttributeNamesValues = [];
const IGroupContainerAttributeNamesValues = [];
const IMiteredPanelAttributeNamesValues = [];
const IModelAttributeNamesValues = [];
const IMountPlaneAttributeNamesValues = [];
const IMountPointAttributeNamesValues = [];
const IPointLightAttributeNamesValues = [];
const ISpotLightAttributeNamesValues = [];
const IToeKickPanelAttributeNamesValues = [];
const IValanceAttributeNamesValues = [];
const IWindowFrameAttributeNamesValues = [];
const InterpretedTypeValuesOptions = {
    operator: InterpretedLineConstantDefaultValue,
    constant: InterpretedLineOperatorDefaultValue,
    size: V3Axes,
    productSize: V3Axes,
    partSize: V3Axes,
    boxContainerSize: V3Axes,
    countertopSize: V3Axes,
    panelSize: V3Axes,
    carcassSize: V3Axes,
    partPosition: V3Axes,
    productAttribute: IProductAttributeNamesValues,
    boxContainerAttribute: IBoxContainerAttributeNamesValues,
    carcassAttribute: ICarcassAttributeNamesValues,
    partAttribute: IPartAttributeNamesValues,
    panelAttribute: IPanelAttributeNamesValues,
    countertopAttribute: ICountertopAttributeNamesValues,
    roomAttribute: IRoomAttributeNamesValues,
    attribute: IAttributeNamesValues,
    materialsSetAttribute: [...materialsSetKeys],
    projectAttribute: IProjectAttributeNamesValues,
    materialsSetMaterialAttributeS: IMaterialsSetMaterialAttributeSValues,
    materialsSetMaterialAttributeN: IMaterialsSetMaterialAttributeNValues,
    materialsSetStyleAttributeS: IMaterialsSetStyleAttributeSValues,
    materialsSetStyleAttributeN: IMaterialsSetStyleAttributeNValues,
    materialsSetAttributeValue: IMaterialsSetAttributeValueValues
};

export { IAttributeNamesValues, IBoxContainerAttributeNamesValues, IBoxContainerPropertyNamesValues, ICarcassAttributeNamesValues, ICountertopAttributeNamesValues, ICrownMoldingAttributeNamesValues, IEdgebandingAttributeNamesValues, IFrameAttributeNamesValues, IGateFrameAttributeNamesValues, IGlassAttributeNamesValues, IGroupContainerAttributeNamesValues, IMaterialsSetAttributeValueValues, IMaterialsSetMaterialAttributeNValues, IMaterialsSetMaterialAttributeSValues, IMaterialsSetStyleAttributeNValues, IMaterialsSetStyleAttributeSValues, IMiteredPanelAttributeNamesValues, IModelAttributeNamesValues, IModelProperyNamesValues, IMountPlaneAttributeNamesValues, IMountPointAttributeNamesValues, INodePropertyNamesValues, IPanelAttributeNamesValues, IPanelProperyNamesValues, IPartAttributeNamesValues, IPartPropertyNamesValues, IPointLightAttributeNamesValues, IPointPropertyNamesValues, IProductAttributeNamesValues, IProductPropertyNamesValues, IProjectAttributeNamesValues, IRoomAttributeNamesValues, IRoomSegmentPropertyNamesValues, ISpotLightAttributeNamesValues, IToeKickPanelAttributeNamesValues, IValanceAttributeNamesValues, IWindowFrameAttributeNamesValues, InterpretedLineConstantDefaultValue, InterpretedLineOperatorDefaultValue, InterpretedTypeValuesOptions };
