import { BoxContainerConfig, NodeType } from '../../../../declarations';
import { CoreDesigner, NodeEffect } from '../../../../designer-core';
declare const _BoxContainerBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.BoxContainer;
    exists?: import("../../../..").IValue<number>;
    parent: import("../../../..").UUID;
    interiorComponents: import("../../../..").UUID[];
    exteriorComponents: import("../../../..").UUID[];
    interiorLayout?: import("../../../..").ContainerLayout;
    exteriorLayout?: import("../../../..").ContainerLayout;
    size: import("../../../..").InterpretedVector3;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    interiorContentName?: string;
    exteriorContentName?: string;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithSizeConfig & import("../../builder").WithInteriorLayoutConfig & import("../../builder").WithExteriorLayoutConfig, import("../../BaseNode").BaseNode<BoxContainerConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, import("../../../Value").default<number>>;
} & {
    readonly properties: Map<"name" | "MVName" | "comment" | "shelfShape", import("../../../Value").default<string | number | boolean | undefined>>;
} & {
    readonly interiorComponents: import("../../../Value").default<import("../../../..").UUID[]>;
} & {
    readonly exteriorComponents: import("../../../Value").default<import("../../../..").UUID[]>;
} & {
    readonly interiorLayout: import("../../../Value").default<import("../../../..").ContainerLayout>;
} & {
    readonly exteriorLayout: import("../../../Value").default<import("../../../..").ContainerLayout>;
}>;
export declare class BoxContainer extends _BoxContainerBase {
    readonly type: NodeType.BoxContainer;
    effects: NodeEffect[];
    readonly disposeEffects: () => void;
    constructor(config: BoxContainerConfig, core: CoreDesigner);
    dispose(): void;
}
export {};
