import { InterpretedCurve, NodeType, UUID } from '../../../../declarations';
import { Wall2DConfig } from '../../../../declarations/Wall2D';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _Wall2DBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    exists?: number;
    parent: UUID;
    type: NodeType.Wall2D;
    children: UUID[];
    attributes: import("../../../..").IAttributes;
    materialId?: UUID;
} & import("../../builder").WithMaterialIdConfig, import("../../BaseNode").BaseNode<Wall2DConfig, NodeType> & {
    readonly materialId: Value<UUID | undefined>;
} & {
    readonly children: Value<UUID[]>;
}>;
export declare class Wall2D extends _Wall2DBase {
    readonly type: NodeType.Wall2D;
    readonly holes: Value<Record<UUID, InterpretedCurve>>;
    constructor(config: Wall2DConfig, core: CoreDesigner);
    toJSON(): Wall2DConfig;
}
export {};
