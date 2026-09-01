import { LaminateBoxConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _LaminateBoxBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.LaminateBox;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig, import("../../BaseNode").BaseNode<LaminateBoxConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class LaminateBox extends _LaminateBoxBase {
    readonly type: NodeType.LaminateBox;
    constructor(config: LaminateBoxConfig, core: CoreDesigner);
    toJSON(): LaminateBoxConfig;
}
export {};
