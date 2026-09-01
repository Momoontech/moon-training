import { InterpretedValue } from './InterpretedValue';
export declare enum ItemType {
    appliance = "appliance",
    cabinet = "cabinet",
    stockCabinet = "stockCabinet",
    window = "window",
    gate = "gate",
    column = "column",
    furniture = "furniture",
    islandbase = "islandbase",
    multiCloset = "multiCloset",
    reachInCloset = "reachInCloset"
}
export declare const ICabinetTypeValues: readonly ["upper", "base", "tall"];
export type cabinetType = (typeof ICabinetTypeValues)[number];
export declare const IMultiClosetTypeValues: readonly ["upper", "base", "tall"];
export type multiClosetType = (typeof IMultiClosetTypeValues)[number];
export declare const IApplianceTypeValues: readonly ["upper", "base", "tall", "sink", "ceiling", "mirror", "pictureFrame", "closetCountertop"];
export type applianceType = (typeof IApplianceTypeValues)[number];
export declare const IFurnitureTypeValues: readonly ["upper", "base", "tall"];
export type furnitureType = (typeof IApplianceTypeValues)[number];
export declare const IDoorOpenTypeValues: readonly ["swing", "flip", "pullout", "drawer", "biFoldLiftTop", "biFoldLiftBottom", "slide", "none"];
export type doorOpenType = (typeof IDoorOpenTypeValues)[number];
export declare const IDoorTypeValues: readonly ["single", "double"];
export type doorType = (typeof IDoorTypeValues)[number];
export declare const IDoorOpenDirectionValues: readonly ["top", "bottom", "left", "right"];
export type doorOpenDirection = (typeof IDoorOpenDirectionValues)[number];
export declare const IDoorOpenSideValues: readonly ["inside", "outside"];
export type doorOpenSide = (typeof IDoorOpenSideValues)[number];
export declare enum RoomType {
    general = "general",
    reachInCloset = "reachInCloset"
}
export declare enum MountType {
    wall = "wall",
    floor = "floor",
    sink = "sink",
    farmhouseSink = "farmhouseSink",
    ceiling = "ceiling",
    countertop = "countertop",
    shelf = "shelf",
    shelfBottom = "shelfBottom",
    mirror = "mirror",
    faucet = "faucet",
    rod = "rod"
}
export type variantOption = {
    label: string;
    value: string;
    DrawerBoxSize?: number | InterpretedValue;
};
type variantCommon = {};
export type variantWithOptions = variantCommon & {
    label: string;
    value: string;
    ignore?: boolean;
    options: variantOption[];
    selected: number;
};
export type variantWithLimits = variantCommon & {
    min: number;
    max: number;
    step?: number;
    value: number;
};
export type variant = variantWithOptions | variantWithLimits;
export type variantTypes = 'width' | 'depth' | 'height';
export type variants = {
    [key in variantTypes]?: variant;
};
export {};
