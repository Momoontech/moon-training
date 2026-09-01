import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IShapeValue } from './IShapeValue';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export declare enum ValanceType {
    top = "topValance",
    bottom = "bottomValance"
}
export type ValanceConfig = NodeSharedConfig & {
    type: NodeType.Valance;
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    valanceType: IValue<ValanceType>;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
    shape: IShapeValue;
    contour: IShapeValue;
    contourLeft: IShapeValue;
    contourRight: IShapeValue;
    materialId?: UUID;
    contourLeftRight: IShapeValue;
};
export type ValanceCatalogConfig = Catalog<ValanceConfig>;
