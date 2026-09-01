import { Catalog, IValue } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { NodeSharedConfig, NodeType } from './Node';
export type StageConfig = NodeSharedConfig & {
    type: NodeType.Stage;
    exists?: IValue<number>;
    parent: UUID;
    rooms: UUID[];
    points: UUID[];
    segments: UUID[];
    attributes: IAttributes;
};
export type StageCatalogConfig = Catalog<StageConfig>;
