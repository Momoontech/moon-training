import { NodeType, SpotLightConfig } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _SpotLightBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.SpotLight;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    position: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig, import("../../BaseNode").BaseNode<SpotLightConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class SpotLight extends _SpotLightBase {
    readonly type: NodeType.SpotLight;
    constructor(config: SpotLightConfig, core: CoreDesigner);
    toJSON(): SpotLightConfig;
}
export {};
