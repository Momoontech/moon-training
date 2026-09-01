import { Ceiling2DConfig, NodeType } from '../../../../declarations';
import { CoreDesigner, NodeEffect } from '../../../../designer-core';
declare const _Ceiling2DBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.Ceiling2D;
    exists?: number;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    attributes: import("../../../..").IAttributes;
    materialId?: import("../../../..").UUID;
} & import("../../builder").WithMaterialIdConfig, import("../../BaseNode").BaseNode<Ceiling2DConfig, NodeType> & {
    readonly materialId: import("../../../Value").default<import("../../../..").UUID | undefined>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class Ceiling2D extends _Ceiling2DBase {
    readonly type: NodeType.Ceiling2D;
    effects: NodeEffect[];
    readonly disposeEffects: () => void;
    constructor(config: Ceiling2DConfig, core: CoreDesigner);
    dispose(): void;
    toJSON(): Ceiling2DConfig;
}
export {};
