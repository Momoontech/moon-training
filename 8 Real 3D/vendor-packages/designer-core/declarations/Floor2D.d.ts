import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { NodeSharedConfig, NodeType } from './Node';
export type Floor2DConfig = NodeSharedConfig & {
    type: NodeType.Floor2D;
    exists?: number;
    parent: UUID;
    children: UUID[];
    attributes: IAttributes;
    materialId?: UUID;
};
export type Floor2DCatalogConfig = Catalog<Floor2DConfig>;
