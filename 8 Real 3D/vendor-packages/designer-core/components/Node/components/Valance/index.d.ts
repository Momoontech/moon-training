import { NodeType, ValanceConfig, ValanceType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _ValanceBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.Valance;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    valanceType: import("../../../..").IValue<ValanceType>;
    position: import("../../../..").InterpretedVector3;
    rotation: import("../../../..").InterpretedVector3;
    attributes: import("../../../..").IAttributes;
    shape: import("../../../..").IShapeValue;
    contour: import("../../../..").IShapeValue;
    contourLeft: import("../../../..").IShapeValue;
    contourRight: import("../../../..").IShapeValue;
    materialId?: import("../../../..").UUID;
    contourLeftRight: import("../../../..").IShapeValue;
} & import("../../builder").WithPosition3DConfig & import("../../builder").WithRotationConfig & import("../../builder").WithShapeConfig & import("../../builder").WithContoursConfig & import("../../builder").WithMaterialIdConfig, import("../../BaseNode").BaseNode<ValanceConfig, NodeType> & {
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
    readonly materialId: Value<import("../../../..").UUID | undefined>;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
}>;
export declare class Valance extends _ValanceBase {
    readonly type: NodeType.Valance;
    readonly valanceType: Value<ValanceType>;
    constructor(config: ValanceConfig, core: CoreDesigner);
    toJSON(): ValanceConfig;
}
export {};
