import { NodeType, ToeKickPanelConfig } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _ToeKickPanelBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.ToeKickPanel;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    grainDirection: import("../../../..").IValue<number>;
    grainOffset?: import("../../../..").InterpretedVector2;
    shape: import("../../../..").IShapeValue;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    materialId?: import("../../../..").UUID;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig & import("../../builder").WithMaterialIdConfig & import("../../builder").WithGrainConfig & import("../../builder").WithShapeConfig, import("../../BaseNode").BaseNode<ToeKickPanelConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly materialId: import("../../../Value").default<import("../../../..").UUID | undefined>;
} & {
    readonly grainDirection: import("../../../Value").default<number>;
    readonly grainOffset?: Record<import("../../../..").V2Axes, import("../../../Value").default<number>>;
} & {
    readonly shape: import("../../../ShapeValue").default;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class ToeKickPanel extends _ToeKickPanelBase {
    readonly type: NodeType.ToeKickPanel;
    constructor(config: ToeKickPanelConfig, core: CoreDesigner);
    toJSON(): ToeKickPanelConfig;
}
export {};
