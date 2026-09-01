import { GateFrameConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _GateFrameBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.GateFrame;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    shape: import("../../../..").IShapeValue;
    grainDirection: import("../../../..").IValue<number>;
    grainOffset: import("../../../..").InterpretedVector2;
    materialId?: import("../../../..").IValue<import("../../../..").UUID>;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig & import("../../builder").WithMaterialIdConfig & import("../../builder").WithGrainConfig & import("../../builder").WithShapeConfig, import("../../BaseNode").BaseNode<GateFrameConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly materialId: import("../../../Value").default<import("../../../..").UUID | undefined>;
} & {
    readonly grainDirection: import("../../../Value").default<number>;
    readonly grainOffset?: Record<import("../../../..").V2Axes, import("../../../Value").default<number>>;
} & {
    readonly shape: import("../../../ShapeValue").default;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class GateFrame extends _GateFrameBase {
    readonly type: NodeType.GateFrame;
    constructor(config: GateFrameConfig, core: CoreDesigner);
    toJSON(): GateFrameConfig;
}
export {};
