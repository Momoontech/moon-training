import { Floor2DConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _Floor2DBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.Floor2D;
    exists?: number;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    attributes: import("../../../..").IAttributes;
    materialId?: import("../../../..").UUID;
} & import("../../builder").WithMaterialIdConfig, import("../../BaseNode").BaseNode<Floor2DConfig, NodeType> & {
    readonly materialId: import("../../../Value").default<import("../../../..").UUID | undefined>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class Floor2D extends _Floor2DBase {
    readonly type: NodeType.Floor2D;
    constructor(config: Floor2DConfig, core: CoreDesigner);
    toJSON(): Floor2DConfig;
}
export {};
