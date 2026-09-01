import { Catalog } from '../';
import { IAttributes, IProductPropertyNames } from './Attributes';
import { UUID } from './core';
import { applianceType, ItemType, MountType, multiClosetType } from './helpers';
import { InterpretedCurve } from './InterpretedCurve';
import { InterpretedVector3 } from './InterpretedVector3';
import { IShapeValue } from './IShapeValue';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type ItemProperties = Partial<Record<IProductPropertyNames, string | number | boolean>>;
export type ItemSharedConfig = NodeSharedConfig & ItemProperties & {
    type: NodeType.Item;
    mountTypes: MountType[];
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    materialsSet: UUID;
    attributes: IAttributes;
    itemNumber?: number;
};
export type IConfigCatalog = {
    attributes: IAttributes;
};
export declare function isCabinetCatalog(c: ItemCatalogConfig): c is CabinetCatalogConfig;
export declare function isApplianceCatalog(c: ItemCatalogConfig): c is ApplianceCatalogConfig;
export declare function isWindowCatalog(c: ItemCatalogConfig): c is WindowCatalogConfig;
export declare function isGateCatalog(c: ItemCatalogConfig): c is GateCatalogConfig;
export declare function isUpperCabinetCatalog(c: CabinetCatalogConfig): c is UpperCabinetCatalogConfig;
export declare function isBaseCabinetCatalog(c: CabinetCatalogConfig): c is BaseCabinetCatalogConfig;
export declare function isTallCabinetCatalog(c: CabinetCatalogConfig): c is TallCabinetCatalogConfig;
export type ApplianceCatalogConfig = BaseApplianceCatalogConfig | TallApplianceCatalogConfig | UpperApplianceCatalogConfig | SinkApplianceCatalogConfig | CeilingApplianceCatalogConfig;
export type CabinetSharedConfig = ItemSharedConfig & {
    itemType: ItemType.cabinet;
    isFinishEnd?: boolean;
    isPilaster?: boolean;
    isMiteredFinishEnd?: boolean;
    isFiller?: boolean;
    isFreePlaced?: boolean;
    isSingleCloset?: boolean;
};
export type CabinetConfig = BaseCabinetConfig | UpperCabinetConfig | TallCabinetConfig;
export type ApplianceConfig = BaseApplianceConfig | UpperApplianceConfig | TallApplianceConfig | SinkApplianceConfig | CeilingApplianceConfig;
export type ApplianceSharedConfig = ItemSharedConfig & {
    itemType: ItemType.appliance;
    applianceType: applianceType;
    isSizable?: boolean;
};
export declare function isUpperApplianceCatalog(c: ApplianceCatalogConfig): c is UpperApplianceCatalogConfig;
export declare function isBaseApplianceCatalog(c: ApplianceCatalogConfig): c is BaseApplianceCatalogConfig;
export declare function isTallApplianceCatalog(c: ApplianceCatalogConfig): c is TallApplianceCatalogConfig;
export declare function isSinkApplianceCatalog(c: ApplianceCatalogConfig): c is SinkApplianceCatalogConfig;
export declare function isCeilingApplianceCatalog(c: ApplianceCatalogConfig): c is CeilingApplianceCatalogConfig;
export type UpperApplianceConfig = ApplianceSharedConfig & {
    applianceType: 'upper';
};
export type UpperApplianceCatalogConfig = Catalog<UpperApplianceConfig>;
export type TallApplianceConfig = ApplianceSharedConfig & {
    applianceType: 'tall';
};
export type TallApplianceCatalogConfig = Catalog<TallApplianceConfig>;
export type BaseApplianceConfig = ApplianceSharedConfig & {
    applianceType: 'base';
};
export type BaseApplianceCatalogConfig = Catalog<BaseApplianceConfig>;
export type SinkApplianceConfig = ApplianceSharedConfig & {
    applianceType: 'sink';
};
export type SinkApplianceCatalogConfig = Catalog<SinkApplianceConfig>;
export type CeilingApplianceConfig = ApplianceSharedConfig & {
    applianceType: 'ceiling';
};
export type CeilingApplianceCatalogConfig = Catalog<CeilingApplianceConfig>;
export type UpperCabinetCatalogConfig = Catalog<UpperCabinetConfig>;
export type UpperCabinetConfig = CabinetSharedConfig & {
    cabinetType: 'upper';
};
export type TallCabinetConfig = CabinetSharedConfig & {
    cabinetType: 'tall';
};
export type TallCabinetCatalogConfig = Catalog<TallCabinetConfig>;
export type BaseCabinetConfig = CabinetSharedConfig & {
    cabinetType: 'base';
    isBackFinishEnd?: boolean;
};
export type BaseCabinetCatalogConfig = Catalog<BaseCabinetConfig>;
export type CabinetCatalogConfig = BaseCabinetCatalogConfig | UpperCabinetCatalogConfig | TallCabinetCatalogConfig;
export type WindowCatalogConfig = Catalog<WindowConfig>;
export type WindowConfig = ItemSharedConfig & {
    itemType: ItemType.window;
    holeShape: InterpretedCurve;
    isSizable?: boolean;
};
export type IslandBaseCatalogConfig = Catalog<IslandBaseConfig>;
export type IslandBaseConfig = ItemSharedConfig & {
    itemType: ItemType.islandbase;
};
export type ColumnCatalogConfig = Catalog<ColumnConfig>;
export type ColumnConfig = ItemSharedConfig & {
    itemType: ItemType.column;
};
export type StockCabinetCatalogConfig = Catalog<StockCabinetConfig>;
export type StockCabinetConfig = ItemSharedConfig & {
    itemType: ItemType.stockCabinet;
};
export type FurnitureCatalogConfig = Catalog<FurnitureConfig>;
export type FurnitureConfig = ItemSharedConfig & {
    itemType: ItemType.furniture;
};
export type GateConfig = ItemSharedConfig & {
    itemType: ItemType.gate;
    holeShape: InterpretedCurve;
    isSizable?: boolean;
};
export type GateCatalogConfig = Catalog<GateConfig>;
export type MultiClosetConfig = ItemSharedConfig & {
    itemType: ItemType.multiCloset;
    LeftMultiClosetNeighborId?: UUID;
    RightMultiClosetNeighborId?: UUID;
    LeftJointMultiClosetNeighborId?: UUID;
    RightJointMultiClosetNeighborId?: UUID;
    sections: UUID[];
    separators: UUID[];
    multiClosetType?: multiClosetType;
    system?: UUID;
    isGenerated?: boolean;
};
export type MultiClosetCatalogConfig = Catalog<MultiClosetConfig>;
export type ReachInClosetConfig = ItemSharedConfig & {
    itemType: ItemType.reachInCloset;
    roomShape: IShapeValue;
    roomId?: UUID;
};
export type ReachInClosetCatalogConfig = Catalog<ReachInClosetConfig>;
export declare function isReachInClosetCatalog(c: ItemCatalogConfig): c is ReachInClosetCatalogConfig;
export type ItemCatalogConfig = CabinetCatalogConfig | ApplianceCatalogConfig | WindowCatalogConfig | GateCatalogConfig | ReachInClosetCatalogConfig | MultiClosetCatalogConfig | IslandBaseCatalogConfig | FurnitureCatalogConfig | ColumnCatalogConfig | StockCabinetCatalogConfig;
export type ItemConfig = CabinetConfig | ApplianceConfig | GateConfig | WindowConfig | IslandBaseConfig | FurnitureConfig | ColumnConfig | StockCabinetConfig | MultiClosetConfig | ReachInClosetConfig;
