import { BaseboardConfig, DecoMoldingConfig, ExtrusionPullConfig, HangingRailConfig, MoldingConfig, MoldingType, NodeType, RodConfig } from '../../../../declarations';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
declare const _MoldingBase: import("../../builder").NodeCtor<(((DecoMoldingConfig | BaseboardConfig) & import("../../builder").WithPosition3DConfig) & import("../../builder").WithRotationConfig) & import("../../builder").WithShapeConfig, import("../../BaseNode").BaseNode<DecoMoldingConfig | BaseboardConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
} & {
    readonly shape: import("../../../ShapeValue").default;
}>;
export declare class Molding extends _MoldingBase {
    readonly type: NodeType.Molding;
    readonly moldingType: Value<MoldingType>;
    constructor(config: DecoMoldingConfig | BaseboardConfig, core: CoreDesigner);
    toJSON(): DecoMoldingConfig | BaseboardConfig;
}
declare const _SimpleMoldingBase: import("../../builder").NodeCtor<((HangingRailConfig | ExtrusionPullConfig | RodConfig) & import("../../builder").WithPosition3DConfig) & import("../../builder").WithRotationConfig, import("../../BaseNode").BaseNode<HangingRailConfig | ExtrusionPullConfig | RodConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly children: Value<import("../../../..").UUID[]>;
}>;
export declare class SimpleMolding extends _SimpleMoldingBase {
    readonly type: NodeType.Molding;
    readonly moldingType: Value<MoldingType>;
    constructor(config: HangingRailConfig | ExtrusionPullConfig | RodConfig, core: CoreDesigner);
    toJSON(): HangingRailConfig | ExtrusionPullConfig | RodConfig;
}
export declare function createMolding(config: MoldingConfig, core: CoreDesigner): Molding | SimpleMolding;
export {};
