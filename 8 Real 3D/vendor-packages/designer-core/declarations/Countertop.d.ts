import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedShape } from './InterpretedShape';
import { InterpretedVector2 } from './InterpretedVector2';
import { InterpretedVector3 } from './InterpretedVector3';
import { IShapeValue } from './IShapeValue';
import { IValue } from './IValue';
import { NodeCatalogConfig, NodeSharedConfig, NodeType } from './Node';
export type CountertopConfig = NodeSharedConfig & {
    type: NodeType.Countertop;
    parent: UUID;
    children: UUID[];
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
    materialId?: UUID;
    shape: IShapeValue;
    grainDirection: IValue<number>;
    grainOffset?: InterpretedVector2;
};
type IFiguredCountertopCatalogConfig = Catalog<CountertopConfig> & {
    figured: 1;
    contour: InterpretedShape;
    shape2: InterpretedShape;
};
type IExtrudedCountertopCatalogConfig = Catalog<CountertopConfig> & {
    figured?: 0;
    children: (string | NodeCatalogConfig)[];
};
export type CountertopCatalogConfig = IFiguredCountertopCatalogConfig | IExtrudedCountertopCatalogConfig;
export {};
