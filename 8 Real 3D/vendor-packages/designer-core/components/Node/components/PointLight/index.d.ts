import { PointLightConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _PointLightBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.PointLight;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig, import("../../BaseNode").BaseNode<PointLightConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class PointLight extends _PointLightBase {
    readonly type: NodeType.PointLight;
    constructor(config: PointLightConfig, core: CoreDesigner);
    toJSON(): PointLightConfig;
}
export {};
