import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export declare enum ModelType {
    accessory = "accessory",
    applianceModel = "applianceModel",
    beltRack = "beltRack",
    camLock = "camLock",
    drawerSlide = "drawerSlide",
    drawerSlideUndermount = "drawerSlideUndermount",
    drawerSystem = "drawerSystem",
    heelCatch = "heelCatch",
    hinge = "hinge",
    hook = "hook",
    leg = "leg",
    ovvoLock = "ovvoLock",
    pole = "pole",
    pull = "pull",
    scarfRack = "scarfRack",
    shoeFence = "shoeFence",
    stripLight = "stripLight",
    slideOutLaundry = "slideOutLaundry",
    suspendedPole = "suspendedPole",
    tieRack = "tieRack",
    tiltOutHamper = "tiltOutHamper"
}
export type ModelSharedConfig = {
    type: NodeType.Model;
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
};
export declare enum HingeType {
    hinge = "hinge",
    hingeBlind = "hingeBlind",
    hingeCornerCorner = "hingeCornerCorner",
    hingeCornerDiagonal = "hingeCornerDiagonal",
    hingeLiftUp = "hingeLiftUp",
    hingeBiFoldLift = "hingeBiFoldLift"
}
export type HingeModelConfig = NodeSharedConfig & ModelSharedConfig & {
    modelType: ModelType.hinge;
    hingeType: HingeType;
    materialId?: UUID;
};
export type ApplianceModelConfig = NodeSharedConfig & ModelSharedConfig & {
    modelType: ModelType.applianceModel;
    modelId: UUID;
    isPositioned?: boolean;
    isSizable?: boolean;
} & ({
    isScalable: boolean | 'x';
    size: InterpretedVector3;
} | {});
export type OtherModelConfig = NodeSharedConfig & ModelSharedConfig & {
    modelType: Exclude<ModelType, ModelType.applianceModel | ModelType.hinge>;
    materialId?: UUID;
    isPositioned?: boolean;
    isSizable?: boolean;
} & ({
    isScalable: boolean | 'x';
    size: InterpretedVector3;
} | {});
export type ModelConfig = HingeModelConfig | ApplianceModelConfig | OtherModelConfig;
export type HingeModelCatalogConfig = Catalog<HingeModelConfig>;
export type ApplianceModelCatalogConfig = Catalog<ApplianceModelConfig>;
export type OtherModelCatalogConfig = Catalog<OtherModelConfig>;
export type ModelCatalogConfig = HingeModelCatalogConfig | ApplianceModelCatalogConfig | OtherModelCatalogConfig;
