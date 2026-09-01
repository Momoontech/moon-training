var ItemType;
(function (ItemType) {
    ItemType["appliance"] = "appliance";
    ItemType["cabinet"] = "cabinet";
    ItemType["stockCabinet"] = "stockCabinet";
    ItemType["window"] = "window";
    ItemType["gate"] = "gate";
    ItemType["column"] = "column";
    ItemType["furniture"] = "furniture";
    ItemType["islandbase"] = "islandbase";
    ItemType["multiCloset"] = "multiCloset";
    ItemType["reachInCloset"] = "reachInCloset";
})(ItemType || (ItemType = {}));
const ICabinetTypeValues = ['upper', 'base', 'tall'];
const IMultiClosetTypeValues = ['upper', 'base', 'tall'];
const IApplianceTypeValues = [
    'upper',
    'base',
    'tall',
    'sink',
    'ceiling',
    'mirror',
    'pictureFrame',
    'closetCountertop'
];
const IFurnitureTypeValues = ['upper', 'base', 'tall'];
// Door attribute value enums. Registered as product attributes in
// `declarations/Attributes.ts` (`IProductAttributeNamesValues`) and set on door
// products / parts in the catalog.
//
// `doorOpenType` mirrors the vesta enum, extended with `slide` (sliding doors) and
// `none` (openings with no operable leaf, e.g. `Products/Doors/GateRectOpening`).
const IDoorOpenTypeValues = [
    'swing',
    'flip',
    'pullout',
    'drawer',
    'biFoldLiftTop',
    'biFoldLiftBottom',
    'slide',
    'none'
];
const IDoorTypeValues = ['single', 'double'];
// Full vesta direction enum. Door products only ever use `left` / `right`
// (and it is absent on double doors) — the top/bottom members are kept so the
// enum stays a superset of the vesta type rather than a door-only narrowing.
const IDoorOpenDirectionValues = ['top', 'bottom', 'left', 'right'];
const IDoorOpenSideValues = ['inside', 'outside'];
var RoomType;
(function (RoomType) {
    RoomType["general"] = "general";
    RoomType["reachInCloset"] = "reachInCloset";
})(RoomType || (RoomType = {}));
var MountType;
(function (MountType) {
    MountType["wall"] = "wall";
    MountType["floor"] = "floor";
    MountType["sink"] = "sink";
    MountType["farmhouseSink"] = "farmhouseSink";
    MountType["ceiling"] = "ceiling";
    MountType["countertop"] = "countertop";
    MountType["shelf"] = "shelf";
    MountType["shelfBottom"] = "shelfBottom";
    MountType["mirror"] = "mirror";
    MountType["faucet"] = "faucet";
    MountType["rod"] = "rod";
})(MountType || (MountType = {}));

export { IApplianceTypeValues, ICabinetTypeValues, IDoorOpenDirectionValues, IDoorOpenSideValues, IDoorOpenTypeValues, IDoorTypeValues, IFurnitureTypeValues, IMultiClosetTypeValues, ItemType, MountType, RoomType };
