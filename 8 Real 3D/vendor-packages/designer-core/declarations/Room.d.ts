import { Catalog, IValue } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { RoomType } from './helpers';
import { NodeSharedConfig, NodeType } from './Node';
export type RoomConfig = NodeSharedConfig & {
    type: NodeType.Room;
    exists?: IValue<number>;
    parent: UUID;
    path: UUID[];
    holes: UUID[][];
    floor2D: UUID;
    ceiling2D: UUID;
    children: UUID[];
    attributes: IAttributes;
    roomType?: RoomType;
    reachInClosetId?: UUID;
};
export type RoomCatalogConfig = Catalog<RoomConfig>;
