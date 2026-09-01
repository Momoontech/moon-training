import { AdjustableBoxConfig, materialType, NodeType, UUID } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _AdjustableBoxBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.AdjustableBox;
    parent: UUID;
    children: UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    grainScale?: number;
    grainDirection: [import("../../../..").IValue<number>, import("../../../..").IValue<number>, import("../../../..").IValue<number>, import("../../../..").IValue<number>, import("../../../..").IValue<number>, import("../../../..").IValue<number>];
    materialTypes: [materialType, materialType, materialType, materialType, materialType, materialType];
    materialIds: [UUID, UUID, UUID, UUID, UUID, UUID];
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig, import("../../BaseNode").BaseNode<AdjustableBoxConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly children: Value<UUID[]>;
}>;
export declare class AdjustableBox extends _AdjustableBoxBase {
    readonly type: NodeType.AdjustableBox;
    readonly grainDirection: [Value<number>, Value<number>, Value<number>, Value<number>, Value<number>, Value<number>];
    readonly grainScale: Value<number | undefined>;
    readonly materialTypes: [Value<materialType>, Value<materialType>, Value<materialType>, Value<materialType>, Value<materialType>, Value<materialType>];
    readonly materialIds: Value<[UUID, UUID, UUID, UUID, UUID, UUID]>;
    constructor(config: AdjustableBoxConfig, core: CoreDesigner);
    toJSON(): AdjustableBoxConfig;
}
export {};
