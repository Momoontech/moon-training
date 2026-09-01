import { Catalog, PartArrayCatalogConfig, PartialPartArrayCatalogConfig } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type CarcassConfig = NodeSharedConfig & {
    type: NodeType.Carcass;
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
};
export type CarcassCatalogConfig = Catalog<CarcassConfig & {
    interiors: (string | PartialPartArrayCatalogConfig | PartArrayCatalogConfig)[];
    exteriors: (string | PartialPartArrayCatalogConfig | PartArrayCatalogConfig)[];
}>;
