import { NodeType, PanelConfig, PanelType, UUID } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
export type edgeMaterialId = UUID | '' | null;
declare const _PanelBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    parent: UUID;
    type: NodeType.Panel;
    children: UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    shape: import("../../../..").IShapeValue;
    materialId?: UUID;
    panelType?: import("../../../..").IValue<PanelType>;
    grainDirection: import("../../../..").IValue<number>;
    grainOffset?: import("../../../..").InterpretedVector2;
    edgeMaterialIds: import("../../../..").IValue<edgeMaterialId>[];
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig & import("../../builder").WithMaterialIdConfig & import("../../builder").WithGrainConfig & import("../../builder").WithShapeConfig, import("../../BaseNode").BaseNode<PanelConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly properties: Map<"name" | "MVName" | "comment" | "PanelProperty1", Value<string | number | boolean | undefined>>;
} & {
    readonly materialId: Value<UUID | undefined>;
} & {
    readonly grainDirection: Value<number>;
    readonly grainOffset?: Record<import("../../../..").V2Axes, Value<number>>;
} & {
    readonly shape: import("../../../ShapeValue").default;
} & {
    readonly children: Value<UUID[]>;
}>;
export declare class Panel extends _PanelBase {
    readonly type: NodeType.Panel;
    readonly panelType: Value<PanelType>;
    readonly edgeMaterialIds: Value<UUID | '' | null>[];
    constructor(config: PanelConfig, core: CoreDesigner);
    toJSON(): PanelConfig;
}
export {};
