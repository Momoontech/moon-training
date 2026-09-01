import { MountLineConfig, NodeType, V2Axes } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _MountLineBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.MountLine;
    parent: import("../../../..").UUID;
    exists?: import("../../../..").IValue<number>;
    mountSlotTypes: import("../../../..").MountType[];
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    children: import("../../../..").UUID[];
    size?: import("../../../..").InterpretedVector2;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithMountConfig, import("../../BaseNode").BaseNode<MountLineConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly mountSlotTypes: Value<import("../../../..").MountType[]>;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
}>;
export declare class MountLine extends _MountLineBase {
    readonly type: NodeType.MountLine;
    readonly size?: Record<V2Axes, Value<number>>;
    constructor(config: MountLineConfig, core: CoreDesigner);
    toJSON(): MountLineConfig;
}
export {};
