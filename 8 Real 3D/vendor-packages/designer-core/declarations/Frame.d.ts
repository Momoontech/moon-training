import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type FrameConfig = NodeSharedConfig & {
    type: NodeType.Frame;
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
};
export type FrameCatalogConfig = Catalog<FrameConfig>;
