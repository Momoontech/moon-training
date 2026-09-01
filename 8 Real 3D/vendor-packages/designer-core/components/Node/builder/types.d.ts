import type { ContainerLayout } from '../../../declarations';
import { IShapeValue, InterpretedVector2, InterpretedVector3, NodeSharedConfig, NodeType, UUID } from '../../../declarations';
import { IValue } from '../../../declarations/IValue';
import { ItemType, MountType } from '../../../declarations/helpers';
import { CoreDesigner } from '../../../designer-core';
import { BaseNode } from '../BaseNode';
export type NodeCtor<TConfig extends NodeSharedConfig, TInstance extends BaseNode<TConfig, NodeType> = BaseNode<TConfig, NodeType>> = abstract new (config: TConfig, core: CoreDesigner) => TInstance;
export type WithPosition3DConfig = {
    position: InterpretedVector3;
};
export type WithPosition2DConfig = {
    position: InterpretedVector2;
};
export type WithRotationConfig = {
    rotation: InterpretedVector3;
};
export type WithSizeConfig = {
    size: InterpretedVector3;
};
export type WithShapeConfig = {
    shape: IShapeValue;
};
export type WithContoursConfig = {
    contour: IShapeValue;
    contourLeft: IShapeValue;
    contourRight: IShapeValue;
    contourLeftRight: IShapeValue;
};
export type WithGrainConfig = {
    grainDirection: IValue<number>;
    grainOffset?: InterpretedVector2;
};
export type WithMaterialIdConfig = {
    materialId?: IValue<UUID>;
};
export type WithMountConfig = {
    mountSlotTypes: IValue<MountType[]>;
};
export type WithMountTypeConfig = {
    mountTypes: MountType[];
};
export type WithItemTypeConfig = {
    itemType: ItemType;
};
export type WithMaterialsSetConfig = {
    materialsSet: UUID;
};
export type WithInteriorLayoutConfig = {
    interiorLayout?: ContainerLayout;
};
export type WithExteriorLayoutConfig = {
    exteriorLayout?: ContainerLayout;
};
