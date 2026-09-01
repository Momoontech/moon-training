import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type AdjustableExtrusionConfig = NodeSharedConfig & {
    type: NodeType.AdjustableExtrusion;
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
};
export type AdjustableExtrusionCatalogConfig = Catalog<AdjustableExtrusionConfig>;
