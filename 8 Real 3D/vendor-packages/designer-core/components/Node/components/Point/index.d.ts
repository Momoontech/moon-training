import { NodeType } from '../../../../declarations';
import { PointConfig } from '../../../../declarations/Point';
import { CoreDesigner } from '../../../../designer-core';
declare const _PointBase: import("../../builder").NodeCtor<import("../../../..").NodeSharedConfig & {
    type: NodeType.Point;
    exists?: number;
    parent: import("../../../..").UUID;
    children: import("../../../..").UUID[];
    position: Record<import("../../../..").V2Axes, import("../../../..").IValue<number>>;
    attributes: import("../../../..").IAttributes;
    isLocked?: boolean;
    isAngleLocked?: boolean;
} & import("../../builder").WithPosition2DConfig, import("../../BaseNode").BaseNode<PointConfig, NodeType> & {
    readonly properties: Map<"isLocked" | "isAngleLocked", import("../../../Value").default<string | number | boolean | undefined>>;
} & {
    readonly position: import("../../builder/steps/withPosition2D").Position2D;
} & {
    readonly children: import("../../../Value").default<import("../../../..").UUID[]>;
}>;
export declare class Point extends _PointBase {
    readonly type: NodeType.Point;
    constructor(config: PointConfig, core: CoreDesigner);
}
export {};
