import { CrownMoldingConfig, NodeType, V2Axes } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _CrownMoldingBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.CrownMolding;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    shape: import("../../../..").IShapeValue;
    contour: import("../../../..").IShapeValue;
    contourLeft: import("../../../..").IShapeValue;
    contourRight: import("../../../..").IShapeValue;
    contourLeftRight: import("../../../..").IShapeValue;
    grainDirection: import("../../../..").IValue<number>;
    grainOffset?: import("../../../..").InterpretedVector2;
    materialId?: import("../../../..").UUID;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithShapeConfig & import("../../builder").WithContoursConfig & import("../../builder").WithGrainConfig & import("../../builder").WithMaterialIdConfig, import("../../BaseNode").BaseNode<CrownMoldingConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly shape: import("../../../ShapeValue").default;
} & {
    readonly contour: import("../../../ShapeValue").default;
    readonly contourLeft: import("../../../ShapeValue").default;
    readonly contourRight: import("../../../ShapeValue").default;
    readonly contourLeftRight: import("../../../ShapeValue").default;
} & {
    readonly grainDirection: Value<number>;
    readonly grainOffset?: Record<V2Axes, Value<number>>;
} & {
    readonly materialId: Value<import("../../../..").UUID | undefined>;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
}>;
export declare class CrownMolding extends _CrownMoldingBase {
    readonly type: NodeType.CrownMolding;
    readonly size: Record<V2Axes, Value<number>>;
    constructor(config: CrownMoldingConfig, core: CoreDesigner);
    toJSON(): CrownMoldingConfig;
}
export {};
