import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { MountType } from './helpers';
import { InterpretedVector2 } from './InterpretedVector2';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type MountLineConfig = NodeSharedConfig & {
    type: NodeType.MountLine;
    /**
     * Floor2D, Ceiling2D, Wall2D id
     */
    parent: UUID;
    exists?: IValue<number>;
    mountSlotTypes: MountType[];
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    /**
     * Item ids
     */
    children: UUID[];
    size?: InterpretedVector2;
    attributes: IAttributes;
};
export type MountLineCatalogConfig = Catalog<MountLineConfig>;
