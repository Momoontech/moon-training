import { NodeType } from '../../../../declarations';
import { MountPlaneConfig } from '../../../../declarations/MountPlane';
import { CoreDesigner } from '../../../../designer-core';
import ShapeValue from '../../../ShapeValue';
declare const _MountPlaneBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.MountPlane;
    parent: import("../../../..").UUID;
    exists?: import("../../../..").IValue<number>;
    mountSlotTypes: import("../../../..").MountType[];
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    children: import("../../../..").UUID[];
    shape?: import("../../../..").IShapeValue;
    size?: import("../../../..").InterpretedVector2;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithMountConfig, import("../../BaseNode").BaseNode<MountPlaneConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly mountSlotTypes: import("../../../Value").default<import("../../../..").MountType[]>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class MountPlane extends _MountPlaneBase {
    readonly type: NodeType.MountPlane;
    readonly shape?: ShapeValue;
    constructor(config: MountPlaneConfig, core: CoreDesigner);
    toJSON(): MountPlaneConfig;
}
export {};
