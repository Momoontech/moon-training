import { Catalog } from '../';
import { edgeMaterialId } from '../components/Node/components/Panel';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector2 } from './InterpretedVector2';
import { InterpretedVector3 } from './InterpretedVector3';
import { IShapeValue } from './IShapeValue';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export declare enum PanelType {
    door = "door",
    body = "body",
    finishEnd = "finishEnd",
    filler = "filler",
    visibleCarcass = "visibleCarcass",
    melamineBox = "melamineBox",
    melamineBoxBottom = "melamineBoxBottom",
    doorInsert = "doorInsert"
}
export type PanelConfig = NodeSharedConfig & {
    parent: UUID;
    type: NodeType.Panel;
    children: UUID[];
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
    shape: IShapeValue;
    materialId?: UUID;
    panelType?: IValue<PanelType>;
    grainDirection: IValue<number>;
    grainOffset?: InterpretedVector2;
    edgeMaterialIds: IValue<edgeMaterialId>[];
};
export type PanelCatalogConfig = Catalog<PanelConfig>;
