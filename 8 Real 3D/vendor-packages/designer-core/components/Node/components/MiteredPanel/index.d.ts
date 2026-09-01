import { MiteredPanelConfig, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
declare const _MiteredPanelBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.MiteredPanel;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig, import("../../BaseNode").BaseNode<MiteredPanelConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class MiteredPanel extends _MiteredPanelBase {
    readonly type: NodeType.MiteredPanel;
    constructor(config: MiteredPanelConfig, core: CoreDesigner);
    toJSON(): MiteredPanelConfig;
}
export {};
