import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IShapeValue } from './IShapeValue';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export type RawPanelConfig = NodeSharedConfig & {
    type: NodeType.RawPanel;
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
    shape: IShapeValue;
};
export type RawPanelCatalogConfig = Catalog<RawPanelConfig>;
