import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { MountType } from './helpers';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type MountPointConfig = NodeSharedConfig & {
    type: NodeType.MountPoint;
    parent: UUID;
    exists?: IValue<number>;
    mountSlotTypes: MountType[];
    position: InterpretedVector3;
    children: UUID[];
    attributes: IAttributes;
};
export type MountPointCatalogConfig = Catalog<MountPointConfig>;
