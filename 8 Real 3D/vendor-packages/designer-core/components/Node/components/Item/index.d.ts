import { ItemConfig, NodeType, UUID } from '../../../../declarations';
import { applianceType, cabinetType, ItemType, multiClosetType } from '../../../../declarations/helpers';
import { CoreDesigner, NodeEffect } from '../../../../designer-core';
import CurveValue from '../../../CurveValue';
import ShapeValue from '../../../ShapeValue';
import Value from '../../../Value';
declare const _ItemBase: import("../../builder").NodeCtor<(((((ItemConfig & import("../../builder").WithPosition3DConfig) & import("../../builder").WithRotationConfig) & import("../../builder").WithSizeConfig) & import("../../builder").WithMountTypeConfig) & import("../../builder").WithItemTypeConfig) & import("../../builder").WithMaterialsSetConfig, import("../../BaseNode").BaseNode<ItemConfig, NodeType> & {
    readonly position: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly rotation: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly size: Record<import("../../../..").V3Axes, Value<number>>;
} & {
    readonly properties: Map<"name" | "MVName" | "comment" | "isFinishEnd" | "catalogPath" | "isFiller" | "HideInCalculation" | "isSingleCloset" | "isMultiCloset" | "isClosetShelf" | "freePartsNonSelectable" | "LeftMultiClosetNeighborId" | "RightMultiClosetNeighborId" | "LeftJointMultiClosetNeighborId" | "RightJointMultiClosetNeighborId" | "itemNumber", Value<string | number | boolean | undefined>>;
} & {
    readonly mountTypes: Value<import("../../../..").MountType[]>;
} & {
    readonly itemType: Value<ItemType>;
} & {
    readonly sections: Value<UUID[]>;
} & {
    readonly separators: Value<UUID[]>;
} & {
    readonly materialsSet: Value<UUID>;
} & {
    readonly children: Value<UUID[]>;
}>;
export declare class Item extends _ItemBase {
    readonly type: NodeType.Item;
    roomShape?: ShapeValue;
    roomId?: Value<UUID | null>;
    effects: NodeEffect[];
    readonly disposeEffects: () => void;
    cabinetType?: Value<cabinetType>;
    multiClosetType?: Value<multiClosetType>;
    applianceType?: Value<applianceType>;
    system?: Value<UUID>;
    isGenerated?: Value<boolean>;
    holeShape?: CurveValue;
    constructor(config: ItemConfig, core: CoreDesigner);
    dispose(): void;
    toJSON(): ItemConfig;
}
export {};
