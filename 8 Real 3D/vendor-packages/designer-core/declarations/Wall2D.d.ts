import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { NodeSharedConfig, NodeType } from './Node';
export type Wall2DConfig = NodeSharedConfig & {
    exists?: number;
    parent: UUID;
    type: NodeType.Wall2D;
    children: UUID[];
    attributes: IAttributes;
    materialId?: UUID;
};
export type Wall2DCatalogConfig = Catalog<Wall2DConfig>;
