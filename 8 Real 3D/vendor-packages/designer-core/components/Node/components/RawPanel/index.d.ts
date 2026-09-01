import { NodeType, RawPanelConfig } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _RawPanelBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.RawPanel;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    shape: import("../../../..").IShapeValue;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig & import("../../builder").WithShapeConfig, import("../../BaseNode").BaseNode<RawPanelConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly shape: import("../../../ShapeValue").default;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class RawPanel extends _RawPanelBase {
    readonly type: NodeType.RawPanel;
    constructor(config: RawPanelConfig, core: CoreDesigner);
    toJSON(): RawPanelConfig;
}
export {};
