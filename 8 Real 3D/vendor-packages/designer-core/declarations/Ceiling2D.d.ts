import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { NodeSharedConfig, NodeType } from './Node';
export type Ceiling2DConfig = NodeSharedConfig & {
    type: NodeType.Ceiling2D;
    exists?: number;
    parent: UUID;
    children: UUID[];
    attributes: IAttributes;
    materialId?: UUID;
};
export type Ceiling2DCatalogConfig = Catalog<Ceiling2DConfig>;
