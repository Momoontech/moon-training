import { Catalog } from '../';
import { UUID } from './core';
import { NodeSharedConfig, NodeType } from './Node';
export type FloorplanConfig = Omit<NodeSharedConfig, 'parent'> & {
    type: NodeType.Floorplan;
    stages: UUID[];
};
export type FloorplanCatalogConfig = Catalog<FloorplanConfig>;
