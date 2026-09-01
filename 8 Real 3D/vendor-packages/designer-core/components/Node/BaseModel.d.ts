import { ModelSharedConfig, ModelType, NodeSharedConfig, NodeType } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
declare const _BaseModelBase: import("./builder").NodeCtor<NodeSharedConfig & ModelSharedConfig & import("./builder").WithPosition3DConfig & import("./builder").WithRotationConfig, import("./BaseNode").BaseNode<NodeSharedConfig & ModelSharedConfig, NodeType> & {
    readonly position: Record<import("../..").V3Axes, import("../Value").default<number>>;
} & {
    readonly rotation: Record<import("../..").V3Axes, import("../Value").default<number>>;
} & {
    readonly children: import("../Value").default<import("../..").UUID[]>;
}>;
export declare abstract class BaseModel extends _BaseModelBase {
    readonly type: NodeType.Model;
    abstract readonly modelType: ModelType;
    constructor(config: NodeSharedConfig & ModelSharedConfig, core: CoreDesigner);
}
export {};
