import { ImageConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _ImageBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.Image;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig, import("../../BaseNode").BaseNode<ImageConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class Image extends _ImageBase {
    readonly type: NodeType.Image;
    constructor(config: ImageConfig, core: CoreDesigner);
    toJSON(): ImageConfig;
}
export {};
