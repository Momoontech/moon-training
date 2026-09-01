import { MountPointConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _MountPointBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.MountPoint;
    parent: import("../../../..").UUID;
    exists?: import("../../../..").IValue<number>;
    mountSlotTypes: import("../../../..").MountType[];
    position: import("../../../..").InterpretedVector3;
    children: import("../../../..").UUID[];
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithMountConfig, import("../../BaseNode").BaseNode<MountPointConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly mountSlotTypes: import("../../../Value").default<import("../../../..").MountType[]>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class MountPoint extends _MountPointBase {
    readonly type: NodeType.MountPoint;
    constructor(config: MountPointConfig, core: CoreDesigner);
    toJSON(): MountPointConfig;
}
export {};
