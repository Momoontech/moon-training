import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
export declare enum ContainerLayout {
    HEIGHT = "HEIGHT",
    WIDTH = "WIDTH"
}
export type BoxContainerConfig = NodeSharedConfig & {
    type: NodeType.BoxContainer;
    exists?: IValue<number>;
    parent: UUID;
    interiorComponents: UUID[];
    exteriorComponents: UUID[];
    interiorLayout?: ContainerLayout;
    exteriorLayout?: ContainerLayout;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
    interiorContentName?: string;
    exteriorContentName?: string;
};
export type BoxContainerCatalogConfig = Catalog<BoxContainerConfig>;
