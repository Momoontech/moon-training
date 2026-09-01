import { NominalHardStr, UUID } from './core';
import { CoreMode, MobileStep } from './CoreDesigner';
import { IValue } from './IValue';
import { RoomSurfaceSettings } from './SurfaceSettings';
import { inches } from './units';
export type informationType = {
    areaName: string;
    projectName: string;
};
export declare const materialsSetKeys: string[];
export declare const materialVariants: readonly ["pole", "ceiling", "countertop", "crownMolding", "defaultMaterialsSet", "defaultClosetMaterialsSet", "drawerSystem", "drawerSlide", "drawerSlideUndermount", "floor", "gateFrame", "glass", "mirror", "windowGlass", "doorGlass", "hingeBlind", "hingeCornerCorner", "hingeCornerDiagonal", "hingeLiftUp", "hingeBiFoldLift", "hinge", "leg", "laminate", "pull", "wall", "windowFrame", "extrusionPull", "rod"];
export type UnitsLabel = NominalHardStr<'UnitsLabel'>;
export type GrainDirectionLabel = NominalHardStr<'GrainDirectionLabel', GrainDirection>;
export interface IGrainDirection<T extends number> {
    label: GrainDirectionLabel;
    value: IValue<T>;
}
export interface IAnyNumbers<T extends number> {
    label: UnitsLabel;
    value: IValue<T>;
}
export interface IAnyCustomType<T> {
    label: UnitsLabel;
    value: IValue<T>;
}
export interface IAnyString<T extends string> {
    label: UnitsLabel;
    value: IValue<T>;
}
export type projectSettingsMaterials = (typeof materialVariants)[number];
export type materialsSetAPI = {
    body: UUID;
    door: UUID;
    doorGrain: IGrainDirection<number>;
    doorsAndDrawersConfiguration: string;
    drawerGrain: IGrainDirection<number>;
    finishEndGrain: IGrainDirection<number>;
    finishEnd: UUID;
    melamineBox: UUID;
    melamineBoxEdgebanding: UUID;
    finishEndsConfiguration: string;
    edgebanding: UUID;
    bodyEdgebanding: UUID;
    doorEdgebanding: UUID;
    finishEndEdgebanding: UUID;
    topValanceEdgebanding: UUID;
    bottomValanceEdgebanding: UUID;
    fillerEdgebanding: UUID;
    visibleCarcassEdgebanding: UUID;
    filler: UUID;
    toeKick: UUID;
    topValance: UUID;
    bottomValance: UUID;
    visiblePanel: UUID;
    visibleCarcass: UUID;
    name: string;
};
export type materialsSets = {
    [key: UUID]: materialsSetAPI;
};
export type materialsTypes = {
    [key in projectSettingsMaterials]: string;
};
export type materialsSetsTypes = keyof materialsSetAPI;
export type materialsType = materialsTypes & {
    markup: IAnyNumbers<number>;
    materialsSets: materialsSets;
    stockMaterialsSets: materialsSets;
    closetMaterialsSets: materialsSets;
};
export interface IAnyUnitsShape {
    label: UnitsLabel;
    value: inches;
}
export declare enum LinearUnits {
    CM = "cm",
    M = "m",
    MM = "mm",
    INCH = "inch",
    FT_ANDINCH = "ftAndInch"
}
export declare enum AngularUnits {
    DEG = "deg",
    RAD = "rad"
}
export declare enum Language {
    EN = "en",
    FR = "fr"
}
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
export declare enum Direction {
    CW = "cw",
    CCW = "ccw"
}
export declare const unitsAttributesList: readonly ["BaseBottomReveal", "BaseClosetDepth", "BaseClosetHeight", "BaseCabinetDepth", "BaseCabinetHeight", "BaseTopReveal", "BlindClearance", "BottomValanceHeight", "BumperGap", "CountertopBackSplashHeight", "CountertopLeftSplashHeight", "CountertopOverhangFront", "CountertopRightSplashHeight", "CountertopThickness", "CrownMoldingRoundingRadius", "DoorThickness", "FixShelfSetback", "GateDepth", "GateDoorDepth", "GateFrameThickD1", "GateFrameThickW1", "GateFrameThickW2", "GateFrameThickW3", "GateHeight", "GlassThickness", "HorizontalGap", "HorizontalHandleDisplacement", "InsetDoorGap", "LeftFillerWidth", "LeftReveal", "MiteredPanelReturn", "PanelThickness", "RailWidth", "RightFillerWidth", "RightReveal", "StileWidth", "StretcherWidth", "SecondPartTopValanceHeight", "TallBottomReveal", "TallCabinetDepth", "TallCabinetHeight", "TallClosetDepth", "TallClosetHeight", "TallTopReveal", "ToeKickHeight", "ClosetToeKickHeight", "ToeKickPanelThickness", "ToeKickSetback", "TopDrawerHeight", "TopValanceHeight", "TopValanceInside", "UpperBottomReveal", "UpperCabinetDepth", "UpperCabinetHeight", "UpperClosetDepth", "UpperClosetHeight", "UpperTopReveal", "VerticalGap", "VerticalHandleDisplacement", "WindowDepth", "WindowDoorDepth", "WindowDoorThickW", "WindowFrameThickW", "BBNotchHeight", "BBNotchDepth", "SQRNotchHeight", "SQRNotchDepth", "WindowHeight", "RailNotchHeight", "RailNotchDepth", "RailNotchPosition"];
export type unitsAttributes = (typeof unitsAttributesList)[number];
export declare const qtyAttributesList: readonly ["BaseShelfQty", "TallShelfQty", "UpperShelfQty"];
export type qtyAttributes = (typeof qtyAttributesList)[number];
export declare const booleanNumberAttributesList: readonly ["ClosetLeftGap", "ClosetRightGap", "ClosetTopGap", "ClosetBottomGap", "CarcassMaterialOnly", "DrawerBoxMaterialOnly", "BottomValanceInside", "BottomValanceOutside", "BottomValanceSolid", "CountertopBackSplash", "CountertopLeftSplash", "CountertopRightSplash", "CrownMoldingPresent", "HandlePresent", "InsetDoor", "SecondPartTopValancePresent", "ToeKickPanelPresent", "ToeKickPanelReturns", "TopValanceOutside", "TopValanceSolid", "FullTopPanel", "IntegratedBottomFinishEnd", "FlushPanels", "ToeKickStretcher", "CountertopPresent", "QRPresent", "RailNotchPresent", "FaciaToeKick", "UpperClosetRoundSides", "OverrideSizes"];
export type booleanNumberAttributes = (typeof booleanNumberAttributesList)[number];
export declare const stringAttributesList: readonly ["DoubleDoorConfigurationPrefix", "FalsePanelConfigurationPrefix", "FinishEndConfigurationPrefix", "SingleDoorConfigurationPrefix", "ShelfConfigurationPrefix", "SingleDrawerConfigurationPrefix"];
export type stringAttributes = (typeof stringAttributesList)[number];
export declare const toeKickTypeList: readonly ["toFloor", "legLeveler", "ladder"];
export declare const drawerBoxTypeList: readonly ["MelamineBox", "ModelBox"];
export declare const drawerSlideTypeList: readonly ["sidemount", "undermount"];
export declare const secondPartTopValanceTypeList: readonly ["panel", "crown"];
export declare const handleTypeTypeList: readonly ["Model", "Extrusion"];
export type toeKickType = (typeof toeKickTypeList)[number];
export type drawerBoxType = (typeof drawerBoxTypeList)[number];
export type drawerSlideType = (typeof drawerSlideTypeList)[number];
export type secondPartTopValanceType = (typeof secondPartTopValanceTypeList)[number];
export type handleTypeType = (typeof handleTypeTypeList)[number];
export declare const directionAttributesList: readonly ["SwingHandleRotation"];
export type directionAttributes = (typeof directionAttributesList)[number];
export declare const mdfColorList: readonly ["MdfColor"];
export type mdfColorAttributes = (typeof mdfColorList)[number];
export type mdfColorAttributeTypes = {
    [key in mdfColorAttributes]: IAnyString<string>;
};
export declare const tieredCrownNumberList: readonly ["TieredCrownNumber"];
export type tieredCrownNumberAttributes = (typeof tieredCrownNumberList)[number];
export type tieredCrownNumberAttributeTypes = {
    [key in tieredCrownNumberAttributes]: IAnyNumbers<0 | 1 | 2 | 3>;
};
export declare const toeKickKeysTypesList: readonly ["ToeKickType"];
export type toeKickTypeAttributes = (typeof toeKickKeysTypesList)[number];
export type toeKickKeysTypes = {
    [key in toeKickTypeAttributes]: IStringAttr<toeKickType>;
};
export declare enum MultiClosetsJointType {
    bridge = "bridge",
    cornerCorner = "cornerCorner",
    cornerDiagonal = "cornerDiagonal",
    none = "none"
}
export declare const multiClosetsJointTypeKeysList: readonly ["MultiClosetsJointType"];
export type multiClosetsJointTypeAttributes = (typeof multiClosetsJointTypeKeysList)[number];
export type multiClosetsJointTypeKeysTypes = {
    [key in multiClosetsJointTypeAttributes]: IStringAttr<MultiClosetsJointType>;
};
export declare const drawerBoxKeysList: readonly ["DrawerBoxType"];
export declare const drawerSlideKeysList: readonly ["DrawerSlideType"];
export declare const secondPartTopValanceKeysList: readonly ["SecondPartTopValanceType"];
export declare const handleTypeKeysList: readonly ["HandleType"];
export type drawerBoxTypeAttribute = (typeof drawerBoxKeysList)[number];
export type drawerSlideTypeAttribute = (typeof drawerSlideKeysList)[number];
export type secondPartTopValanceTypeAttribute = (typeof secondPartTopValanceKeysList)[number];
export type handleTypeTypeAttribute = (typeof handleTypeKeysList)[number];
export declare enum GrainDirection {
    horizontal = "horizontal",
    vertical = "vertical"
}
export type unitsAttributesTypes = {
    [key in unitsAttributes]: inches;
};
export type qtyAttributesTypes = {
    [key in qtyAttributes]: IStringAttr<string>;
};
export type booleanNumberAttributesTypes = {
    [key in booleanNumberAttributes]: IAnyNumbers<0 | 1>;
};
export type stringAttributesTypes = {
    [key in stringAttributes]: IStringAttr<string>;
};
export type directionAttributesTypes = {
    [key in directionAttributes]: IStringAttr<GrainDirection>;
};
export type drawerBoxTypes = {
    [key in drawerBoxTypeAttribute]: DrawerBoxType;
};
export type drawerSlideKeysTypes = {
    [key in drawerSlideTypeAttribute]: DrawerSlideType;
};
export type secondPartTopValanceKeysTypes = {
    [key in secondPartTopValanceTypeAttribute]: SecondPartTopValanceType;
};
export type handleTypeTypes = {
    [key in handleTypeTypeAttribute]: HandleTypeType;
};
export declare const integratedFinishPanelHideList: readonly ["IntegratedFinishPanelHide"];
export type integratedFinishPanelHideAttribute = (typeof integratedFinishPanelHideList)[number];
export type integratedFinishPanelHideTypes = {
    [key in integratedFinishPanelHideAttribute]: IAnyNumbers<0 | 1>;
};
export declare const materialSetVisiblePanelHideList: readonly ["MaterialSetVisiblePanelHide"];
export type materialSetVisiblePanelHideAttribute = (typeof materialSetVisiblePanelHideList)[number];
export type materialSetVisiblePanelHideTypes = {
    [key in materialSetVisiblePanelHideAttribute]: IAnyNumbers<0 | 1>;
};
export declare const materialSetEdgebadingHideList: readonly ["MaterialSetEdgebadingHide"];
export type materialSetEdgebadingHideAttribute = (typeof materialSetEdgebadingHideList)[number];
export type materialSetEdgebadingHideTypes = {
    [key in materialSetEdgebadingHideAttribute]: IAnyNumbers<0 | 1>;
};
export declare const materialSetFinishEndHideList: readonly ["MaterialSetFinishEndHide"];
export type materialSetFinishEndHideAttribute = (typeof materialSetFinishEndHideList)[number];
export type materialSetFinishEndHideTypes = {
    [key in materialSetFinishEndHideAttribute]: IAnyNumbers<0 | 1>;
};
export declare const partPropertyHideList: readonly ["PartPropertyHide"];
export type partPropertyHideAttribute = (typeof partPropertyHideList)[number];
export type partPropertyHideTypes = {
    [key in partPropertyHideAttribute]: IAnyNumbers<0 | 1>;
};
export declare const firstHoleDirectionList: readonly ["FirstHoleDirection"];
export type firstHoleDirectionAttribute = (typeof firstHoleDirectionList)[number];
export type firstHoleDirectionTypes = {
    [key in firstHoleDirectionAttribute]: IAnyString<'bottom'>;
};
export declare const firstHoleOffsetList: readonly ["FirstHoleOffset"];
export type firstHoleOffsetAttribute = (typeof firstHoleOffsetList)[number];
export type firstHoleOffsetTypes = {
    [key in firstHoleOffsetAttribute]: inches;
};
export declare const lastHoleOffsetList: readonly ["LastHoleOffset"];
export type lastHoleOffsetAttribute = (typeof lastHoleOffsetList)[number];
export type lastHoleOffsetTypes = {
    [key in lastHoleOffsetAttribute]: inches;
};
export type attributesType = unitsAttributes | qtyAttributes | booleanNumberAttributes | stringAttributes | directionAttributes | mdfColorAttributes | tieredCrownNumberAttributes | toeKickTypeAttributes | multiClosetsJointTypeAttributes | drawerBoxTypeAttribute | drawerSlideTypeAttribute | secondPartTopValanceTypeAttribute | handleTypeTypeAttribute | integratedFinishPanelHideAttribute | materialSetVisiblePanelHideAttribute | materialSetEdgebadingHideAttribute | materialSetFinishEndHideAttribute | partPropertyHideAttribute | firstHoleDirectionAttribute | firstHoleOffsetAttribute | lastHoleOffsetAttribute;
export type SecondPartTopValanceType = IStringAttr<secondPartTopValanceType>;
export type DrawerBoxType = IStringAttr<drawerBoxType>;
export type DrawerSlideType = IStringAttr<drawerSlideType>;
export type HandleTypeType = IStringAttr<handleTypeType>;
export type projectAttributesType = unitsAttributesTypes & qtyAttributesTypes & booleanNumberAttributesTypes & stringAttributesTypes & directionAttributesTypes & mdfColorAttributeTypes & tieredCrownNumberAttributeTypes & toeKickKeysTypes & multiClosetsJointTypeKeysTypes & drawerBoxTypes & drawerSlideKeysTypes & secondPartTopValanceKeysTypes & handleTypeTypes & integratedFinishPanelHideTypes & materialSetVisiblePanelHideTypes & materialSetEdgebadingHideTypes & materialSetFinishEndHideTypes & partPropertyHideTypes & firstHoleDirectionTypes & firstHoleOffsetTypes & lastHoleOffsetTypes;
type roomTemplateLabel = 'Single wall floor plan' | 'L-Shape floor plan' | 'U-Shape floor plan' | 'Rectangular floor plan';
export type roomTemplateValue = 'single' | 'L-shape' | 'U-shape' | 'full';
export type roomTemplateImg = '/img/square.jpg' | '/img/U-shape.jpg';
export interface IRoomTemplate {
    label: roomTemplateLabel;
    value: roomTemplateValue;
    img: roomTemplateImg;
}
export declare enum PaperSizeRatio {
    Legal = "Legal",
    A4 = "A4"
}
export interface IStringAttr<T extends string> {
    label: string;
    value: IValue<T>;
}
export interface IPrintMode {
    cabinetNamesOnElevation: IAnyNumbers<number>;
    cabinetNamesOnFloor: IAnyNumbers<number>;
    paperSizeRatio: IStringAttr<PaperSizeRatio>;
}
export interface IPrintModePlain {
    cabinetNamesOnElevation: IValue<number>;
    cabinetNamesOnFloor: IValue<number>;
    paperSizeRatio: IValue<PaperSizeRatio>;
}
export interface IRoomWidthDepth {
    single: {
        width: inches;
    };
    full: {
        depth: inches;
        width: inches;
    };
    'L-shape': {
        depth: inches;
        width: inches;
    };
    'U-shape': {
        depth: inches;
        depth2: inches;
        width: inches;
    };
}
export type RoomSnapSettings = {
    corner: {
        ortho: boolean;
    };
};
export type roomSettingsType = {
    printMode: IPrintModePlain;
    roomTemplate: roomTemplateValue;
    roomWidthDepth: IRoomWidthDepth;
    wHeight: inches;
    wDepth: inches;
    ambientLightIntensity: number;
    disabledAmbientIntensity: number;
    spotLightsPower: number;
    snap: RoomSnapSettings;
    surfaceSettings: RoomSurfaceSettings;
    /**
     * Globally-selected edit direction for dimension / angle badges. Optional
     * on the persisted shape so projects saved before the field existed still
     * deserialise — `RoomSettings` defaults missing values to {@link Direction.CW}.
     * The runtime class always exposes a non-null `Value<Direction>` so consumers
     * (overlays, commands) never have to deal with `undefined`.
     */
    editingDirection?: Direction;
};
export type IProjectSettingsShared = {
    coreMode: CoreMode;
    mobileSettings?: IMobileProjectSettings;
    webSettings?: IWebProjectSettings;
    information: informationType;
    materials: materialsType;
    projectAttributes: projectAttributesType;
    roomSettings: roomSettingsType;
    language: Language;
    snapSensitivity: inches;
    units: LinearUnits;
    /**
     * Angle display unit (M3D-294). Optional on the persisted shape so projects
     * saved before the field existed still deserialise — {@link ProjectSettingsBase}
     * defaults it to {@link AngularUnits.DEG}.
     */
    angularUnits?: AngularUnits;
    version: number;
    itemNumber: number;
    wallNumber: number;
};
export type IMobileProjectSettings = IProjectSettingsShared & {
    coreMode: CoreMode.mobile;
    mobileSettings: {
        step: MobileStep;
    };
};
export type IWebProjectSettings = IProjectSettingsShared & {
    coreMode: CoreMode.web;
    webSettings: {};
};
export type IProjectSettings = IMobileProjectSettings | IWebProjectSettings;
export {};
