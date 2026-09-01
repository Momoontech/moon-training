const materialsSetKeys = [
    'body',
    'door',
    'doorGrain',
    'doorsAndDrawersConfiguration',
    'drawerGrain',
    'finishEnd',
    'bottomFinishEnd',
    'finishEndsConfiguration',
    'edgebanding',
    'glass',
    'bodyEdgebanding',
    'doorEdgebanding',
    'finishEndEdgebanding',
    'topValanceEdgebanding',
    'bottomValanceEdgebanding',
    'fillerEdgebanding',
    'visibleCarcassEdgebanding',
    'filler',
    'toeKick',
    'topValance',
    'bottomValance',
    'visiblePanel',
    'visibleCarcass'
];
const materialVariants = [
    'pole',
    'ceiling',
    'countertop',
    'crownMolding',
    'defaultMaterialsSet',
    'defaultClosetMaterialsSet',
    'drawerSystem',
    'drawerSlide',
    'drawerSlideUndermount',
    'floor',
    'gateFrame',
    'glass',
    'mirror',
    'windowGlass',
    'doorGlass',
    'hingeBlind',
    'hingeCornerCorner',
    'hingeCornerDiagonal',
    'hingeLiftUp',
    'hingeBiFoldLift',
    'hinge',
    'leg',
    'laminate',
    'pull',
    'wall',
    'windowFrame',
    'extrusionPull',
    'rod'
];
var LinearUnits;
(function (LinearUnits) {
    LinearUnits["CM"] = "cm";
    LinearUnits["M"] = "m";
    LinearUnits["MM"] = "mm";
    LinearUnits["INCH"] = "inch";
    LinearUnits["FT_ANDINCH"] = "ftAndInch";
})(LinearUnits || (LinearUnits = {}));
var AngularUnits;
(function (AngularUnits) {
    AngularUnits["DEG"] = "deg";
    AngularUnits["RAD"] = "rad";
})(AngularUnits || (AngularUnits = {}));
var Language;
(function (Language) {
    Language["EN"] = "en";
    Language["FR"] = "fr";
})(Language || (Language = {}));
/**
 * Edit-direction convention for dimension / angle badges.
 *
 * Globally selected by the user (toggle on any badge writes the project-wide
 * `roomSettings.editingDirection` signal — see `SetEditingDirectionCommand`)
 * so every overlay agrees on which side of a wall, or which arm of a corner,
 * is anchored when a value is committed:
 *
 * - **CW** (clockwise) — the canonical / default convention.
 *   - Wall length edit: extend in the segment's `from → to` direction (the
 *     `from` endpoint stays fixed, `to` moves).
 *   - Angle edit: keep the existing fixed-arm selection (matches the legacy
 *     pre-direction behaviour, preserved for backward compatibility).
 * - **CCW** (counter-clockwise) — the swapped convention.
 *   - Wall length edit: extend in the `to → from` direction (`to` stays
 *     fixed, `from` moves).
 *   - Angle edit: swap which arm is fixed and which rotates.
 *
 * The signal is project-scoped: persisted alongside the rest of `RoomSettings`
 * so a user who prefers CCW keeps that preference per project. Per-overlay
 * code may still derive an **effective** direction by combining this global
 * signal with local conditions (e.g. inverting CW to CCW for a specific wall
 * when the future lock feature blocks the global side) — see `useDirection`.
 */
var Direction;
(function (Direction) {
    Direction["CW"] = "cw";
    Direction["CCW"] = "ccw";
})(Direction || (Direction = {}));
const unitsAttributesList = [
    'BaseBottomReveal',
    'BaseClosetDepth',
    'BaseClosetHeight',
    'BaseCabinetDepth',
    'BaseCabinetHeight',
    'BaseTopReveal',
    'BlindClearance',
    'BottomValanceHeight',
    'BumperGap',
    'CountertopBackSplashHeight',
    'CountertopLeftSplashHeight',
    'CountertopOverhangFront',
    'CountertopRightSplashHeight',
    'CountertopThickness',
    'CrownMoldingRoundingRadius',
    'DoorThickness',
    'FixShelfSetback',
    'GateDepth',
    'GateDoorDepth',
    'GateFrameThickD1',
    'GateFrameThickW1',
    'GateFrameThickW2',
    'GateFrameThickW3',
    'GateHeight',
    'GlassThickness',
    'HorizontalGap',
    'HorizontalHandleDisplacement',
    'InsetDoorGap',
    'LeftFillerWidth',
    'LeftReveal',
    'MiteredPanelReturn',
    'PanelThickness',
    'RailWidth',
    'RightFillerWidth',
    'RightReveal',
    'StileWidth',
    'StretcherWidth',
    'SecondPartTopValanceHeight',
    'TallBottomReveal',
    'TallCabinetDepth',
    'TallCabinetHeight',
    'TallClosetDepth',
    'TallClosetHeight',
    'TallTopReveal',
    'ToeKickHeight',
    'ClosetToeKickHeight',
    'ToeKickPanelThickness',
    'ToeKickSetback',
    'TopDrawerHeight',
    'TopValanceHeight',
    'TopValanceInside',
    'UpperBottomReveal',
    'UpperCabinetDepth',
    'UpperCabinetHeight',
    'UpperClosetDepth',
    'UpperClosetHeight',
    'UpperTopReveal',
    'VerticalGap',
    'VerticalHandleDisplacement',
    'WindowDepth',
    'WindowDoorDepth',
    'WindowDoorThickW',
    'WindowFrameThickW',
    'BBNotchHeight',
    'BBNotchDepth',
    'SQRNotchHeight',
    'SQRNotchDepth',
    'WindowHeight',
    'RailNotchHeight',
    'RailNotchDepth',
    'RailNotchPosition'
];
const qtyAttributesList = ['BaseShelfQty', 'TallShelfQty', 'UpperShelfQty'];
const booleanNumberAttributesList = [
    'ClosetLeftGap',
    'ClosetRightGap',
    'ClosetTopGap',
    'ClosetBottomGap',
    'CarcassMaterialOnly',
    'DrawerBoxMaterialOnly',
    'BottomValanceInside',
    'BottomValanceOutside',
    'BottomValanceSolid',
    'CountertopBackSplash',
    'CountertopLeftSplash',
    'CountertopRightSplash',
    'CrownMoldingPresent',
    'HandlePresent',
    'InsetDoor',
    'SecondPartTopValancePresent',
    'ToeKickPanelPresent',
    'ToeKickPanelReturns',
    'TopValanceOutside',
    'TopValanceSolid',
    'FullTopPanel',
    'IntegratedBottomFinishEnd',
    'FlushPanels',
    'ToeKickStretcher',
    'CountertopPresent',
    'QRPresent',
    'RailNotchPresent',
    'FaciaToeKick',
    'UpperClosetRoundSides',
    'OverrideSizes'
];
const stringAttributesList = [
    'DoubleDoorConfigurationPrefix',
    'FalsePanelConfigurationPrefix',
    'FinishEndConfigurationPrefix',
    'SingleDoorConfigurationPrefix',
    'ShelfConfigurationPrefix',
    'SingleDrawerConfigurationPrefix'
];
const toeKickTypeList = ['toFloor', 'legLeveler', 'ladder'];
const drawerBoxTypeList = ['MelamineBox', 'ModelBox'];
const drawerSlideTypeList = ['sidemount', 'undermount'];
const secondPartTopValanceTypeList = ['panel', 'crown'];
const handleTypeTypeList = ['Model', 'Extrusion'];
const directionAttributesList = ['SwingHandleRotation'];
const mdfColorList = ['MdfColor'];
const tieredCrownNumberList = ['TieredCrownNumber'];
const toeKickKeysTypesList = ['ToeKickType'];
var MultiClosetsJointType;
(function (MultiClosetsJointType) {
    MultiClosetsJointType["bridge"] = "bridge";
    MultiClosetsJointType["cornerCorner"] = "cornerCorner";
    MultiClosetsJointType["cornerDiagonal"] = "cornerDiagonal";
    // Opt-in value that matches none of the bridge/corner equality gates, so a
    // closet side set to `none` shows neither a bridge nor a corner joint and
    // reserves no width (layout effect + catalog `exists` both fail to match).
    MultiClosetsJointType["none"] = "none";
})(MultiClosetsJointType || (MultiClosetsJointType = {}));
const multiClosetsJointTypeKeysList = ['MultiClosetsJointType'];
const drawerBoxKeysList = ['DrawerBoxType'];
const drawerSlideKeysList = ['DrawerSlideType'];
const secondPartTopValanceKeysList = ['SecondPartTopValanceType'];
const handleTypeKeysList = ['HandleType'];
var GrainDirection;
(function (GrainDirection) {
    GrainDirection["horizontal"] = "horizontal";
    GrainDirection["vertical"] = "vertical";
})(GrainDirection || (GrainDirection = {}));
const integratedFinishPanelHideList = ['IntegratedFinishPanelHide'];
const materialSetVisiblePanelHideList = ['MaterialSetVisiblePanelHide'];
const materialSetEdgebadingHideList = ['MaterialSetEdgebadingHide'];
const materialSetFinishEndHideList = ['MaterialSetFinishEndHide'];
const partPropertyHideList = ['PartPropertyHide'];
const firstHoleDirectionList = ['FirstHoleDirection'];
const firstHoleOffsetList = ['FirstHoleOffset'];
const lastHoleOffsetList = ['LastHoleOffset'];
var PaperSizeRatio;
(function (PaperSizeRatio) {
    PaperSizeRatio["Legal"] = "Legal";
    PaperSizeRatio["A4"] = "A4";
})(PaperSizeRatio || (PaperSizeRatio = {}));

export { AngularUnits, Direction, GrainDirection, Language, LinearUnits, MultiClosetsJointType, PaperSizeRatio, booleanNumberAttributesList, directionAttributesList, drawerBoxKeysList, drawerBoxTypeList, drawerSlideKeysList, drawerSlideTypeList, firstHoleDirectionList, firstHoleOffsetList, handleTypeKeysList, handleTypeTypeList, integratedFinishPanelHideList, lastHoleOffsetList, materialSetEdgebadingHideList, materialSetFinishEndHideList, materialSetVisiblePanelHideList, materialVariants, materialsSetKeys, mdfColorList, multiClosetsJointTypeKeysList, partPropertyHideList, qtyAttributesList, secondPartTopValanceKeysList, secondPartTopValanceTypeList, stringAttributesList, tieredCrownNumberList, toeKickKeysTypesList, toeKickTypeList, unitsAttributesList };
