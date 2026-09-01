import { FreeBoxContainerConfig, FreeBoxContainerType, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _FreeBoxContainerBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.FreeBoxContainer;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    bays?: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    freeBoxContainerType?: FreeBoxContainerType;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig, import("../../BaseNode").BaseNode<FreeBoxContainerConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
} & {
    readonly bays: Value<import("../../../..").UUID[]>;
}>;
export declare const step32mm: number;
export declare const defaultFirstHoleOffset: number;
export declare class FreeBoxContainer extends _FreeBoxContainerBase {
    readonly type: NodeType.FreeBoxContainer;
    readonly freeBoxContainerType: Value<FreeBoxContainerType | undefined>;
    private readonly disposeEffects?;
    constructor(config: FreeBoxContainerConfig, core: CoreDesigner);
    dispose(): void;
    toJSON(): FreeBoxContainerConfig;
}
export {};
