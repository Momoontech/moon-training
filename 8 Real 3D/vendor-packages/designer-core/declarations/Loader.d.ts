import { UUID } from './core';
export type materials = {
    obj: {
        [key in materialType | 'applianceModel']: {
            [key: string]: material;
        };
    };
    arr: {
        [key in materialType]: material[];
    };
};
export type look = {
    _id: string;
    img: string;
    value: string;
    label: string;
    color?: string;
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    type?: 'basic';
    opacity?: number;
    transparency?: number;
    clearcoat?: number;
    reflectivity?: number;
    map: string | null;
    normalMap: string | null;
    roughnessMap: string | null;
    alphaMap: string | null;
    metalnessMap: string | null;
    emissiveMap: string | null;
    envMap: string | null;
    aoMap: string | null;
    aoMapIntensity?: number;
    envMapIntensity?: number;
    emissive?: number;
    emissiveIntensity?: number;
    subCategory1?: string;
    subCategory2?: string;
    subCategory3?: string;
    subCategory4?: string;
    subCategory5?: string;
};
export declare enum LookCategory {
    Materials = "Materials",
    Surfaces = "Surfaces",
    Mouldings = "Mouldings",
    Hardware = "Hardware",
    Decor = "Decor"
}
export type looksAPI = {
    [key in LookCategory]: look[];
};
export declare const IMaterialTypeValues: readonly ["accessory", "body", "melamineBox", "melamineBoxBottom", "doorInsert", "doorInsertEdgebanding", "melamineBoxEdgebanding", "bottomFinishEnd", "bottomValance", "bottomValanceEdgebanding", "bodyEdgebanding", "ceiling", "countertop", "crownMolding", "door", "drawerSystem", "drawerSlide", "drawerSlideUndermount", "doorEdgebanding", "doorStyle", "edgebanding", "finishEndEdgebanding", "fillerEdgebanding", "visibleCarcassEdgebanding", "filler", "finishEnd", "floor", "gateFrame", "glass", "windowGlass", "doorGlass", "mirror", "hingeBlind", "hingeCornerCorner", "hingeCornerDiagonal", "hingeLiftUp", "hingeBiFoldLift", "hinge", "leg", "pull", "slideOutLaundry", "tieRack", "stripLight", "pole", "suspendedPole", "tiltOutHamper", "scarfRack", "beltRack", "extrusionPull", "rod", "hook", "toeKick", "topValance", "topValanceEdgebanding", "visiblePanel", "visibleCarcass", "windowFrame", "wall", "laminate", "hangingRail", "camLock", "ovvoLock", "shoeFence", "heelCatch", "picture"];
export type materialType = (typeof IMaterialTypeValues)[number];
export type imageType = 'picture' | 'islandbase';
export type lookType = materialType | imageType | 'service';
export type sourceType = 'binary' | 'text';
export type model3D = {
    _id: string;
    img?: string;
    name?: string;
    source: string;
    sourceType: sourceType;
    drillingDistance?: number;
    subCategory1?: string;
    subCategory2?: string;
    subCategory3?: string;
    subCategory4?: string;
    subCategory5?: string;
};
export declare enum Model3DCategory {
    Library = "Library",
    Hardware = "Hardware"
}
export type models3DAPI = {
    [key in Model3DCategory]: model3D[];
};
export type doorStyleCalcType = 'Single Piece' | 'Five Piece';
export type material = {
    _id: UUID;
    img?: string;
    label: string;
    value: string;
    articleNumber?: string;
    manufacturer?: string;
    doorStyle?: string;
    calcType?: doorStyleCalcType;
    matchingEdgeband?: string;
    matchingQuarterThick?: UUID;
    matchingVisiblePanel?: UUID;
    modelId?: string;
    parentId?: string;
    modelEndCupId?: string;
    modelSuspendedCenterId?: string;
    modelSuspendedEndId?: string;
    drillingDistance?: number;
    lossFactorLinear?: number;
    supplier?: string;
    sheetLength: number;
    sheetWidth: number;
    lossFactor: number;
    thickness: number;
    lookId?: string;
    lookName?: string;
    shape?: string;
    variants?: any[];
    subCategory1: string;
    subCategory2: string;
    subCategory3?: string;
    subCategory4?: string;
    subCategory5?: string;
    DrawerBoxConstruction?: string;
    RollOutConstruction?: string;
    DoorExportName?: string;
    DrawerExportName?: string;
};
export declare enum MaterialCategory {
    Materials = "Materials",
    Surfaces = "Surfaces",
    Mouldings = "Mouldings",
    Hardware = "Hardware",
    Miscellaneous = "Miscellaneous"
}
export type materialsAPI = {
    [key in MaterialCategory]: material[];
};
