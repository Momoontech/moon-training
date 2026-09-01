import { CountertopConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _CountertopBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.Countertop;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    materialId?: import("../../../..").UUID;
    shape: import("../../../..").IShapeValue;
    grainDirection: import("../../../..").IValue<number>;
    grainOffset?: import("../../../..").InterpretedVector2;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig & import("../../builder").WithMaterialIdConfig & import("../../builder").WithGrainConfig & import("../../builder").WithShapeConfig, import("../../BaseNode").BaseNode<CountertopConfig, NodeType> & {
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
export declare class Countertop extends _CountertopBase {
    readonly type: NodeType.Countertop;
    constructor(config: CountertopConfig, core: CoreDesigner);
    toJSON(): CountertopConfig;
}
export {};
