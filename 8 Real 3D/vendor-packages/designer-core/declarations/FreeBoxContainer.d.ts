import { Catalog } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { InterpretedVector3 } from './InterpretedVector3';
import { IValue } from './IValue';
import { NodeSharedConfig, NodeType } from './Node';
/**
 * Behavior flavor of a FreeBoxContainer. Absent ⇒ the historical, passive
 * container (no layout effect). `multiCloset` ⇒ the container stacks its direct
 * children (stacks + fix shelves) bottom-to-top via
 * `updateMultiClosetFreeBoxContainerLayoutEffect`.
 */
export declare enum FreeBoxContainerType {
    multiCloset = "multiClosetFreeBoxContainer"
}
export type FreeBoxContainerConfig = NodeSharedConfig & {
    type: NodeType.FreeBoxContainer;
    parent: UUID;
    children: UUID[];
    /**
     * Ordered child slot used by the `multiCloset` flavor: the section column's
     * stacks + fix-shelf dividers (bottom-to-top by index). Plain FreeBoxContainers
     * leave this empty and use `children` instead.
     */
    bays?: UUID[];
    exists?: IValue<number>;
    size: InterpretedVector3;
    position: InterpretedVector3;
    rotation: InterpretedVector3;
    attributes: IAttributes;
    freeBoxContainerType?: FreeBoxContainerType;
};
export type FreeBoxContainerCatalogConfig = Catalog<FreeBoxContainerConfig>;
