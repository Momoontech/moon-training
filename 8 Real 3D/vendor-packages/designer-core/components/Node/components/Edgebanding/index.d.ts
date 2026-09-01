import { EdgebandingConfig, EdgebandingType, NodeType } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _EdgebandingBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    parent: import("../../../..").UUID;
    type: NodeType.Edgebanding;
    children: import("../../../..").UUID[];
    exists?: import("../../../..").IValue<number>;
    attributes: import("../../../..").IAttributes;
    edgebandingType: import("../../../..").IValue<EdgebandingType>;
    shape: import("../../../..").IShapeValue;
} & import("../../builder").WithShapeConfig, import("../../BaseNode").BaseNode<EdgebandingConfig, NodeType> & {
    readonly shape: import("../../../ShapeValue").default;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
}>;
export declare class Edgebanding extends _EdgebandingBase {
    readonly type: NodeType.Edgebanding;
    readonly edgebandingType: Value<EdgebandingType>;
    constructor(config: EdgebandingConfig, core: CoreDesigner);
    toJSON(): EdgebandingConfig;
}
export {};
