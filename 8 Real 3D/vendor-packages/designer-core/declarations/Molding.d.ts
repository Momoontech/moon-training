import { Catalog, IShapeValue } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { IValue } from './IValue';
import { InterpretedVector3 } from './InterpretedVector3';
import { NodeSharedConfig, NodeType } from './Node';
export declare enum MoldingType {
    extrusionPull = "extrusionPull",
    rod = "rod",
    hangingRail = "hangingRail",
    decoMolding = "decoMolding",
    baseboard = "baseboard"
}
type MoldingSharedConfig = NodeSharedConfig & {
    type: NodeType.Molding;
    parent: UUID;
    exists?: IValue<number>;
    attributes: IAttributes;
    moldingType: MoldingType;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    children: UUID[];
};
export type HangingRailConfig = MoldingSharedConfig & {
    moldingType: MoldingType.hangingRail;
};
export type DecoMoldingConfig = MoldingSharedConfig & {
    moldingType: MoldingType.decoMolding;
    shape: IShapeValue;
};
export type BaseboardConfig = MoldingSharedConfig & {
    moldingType: MoldingType.baseboard;
    shape: IShapeValue;
};
export type ExtrusionPullConfig = MoldingSharedConfig & {
    moldingType: MoldingType.extrusionPull;
};
export type RodConfig = MoldingSharedConfig & {
    moldingType: MoldingType.rod;
};
export type MoldingConfig = HangingRailConfig | DecoMoldingConfig | BaseboardConfig | ExtrusionPullConfig | RodConfig;
export type MoldingCatalogConfig = Catalog<MoldingConfig>;
export {};
