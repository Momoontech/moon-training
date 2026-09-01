import { NodeSharedConfig, UUID } from '../../../declarations';
import Value from '../../Value';
import { childrenProperties } from '../helpers/childrenProperties';
import { withContours } from './steps/withContours';
import { withExteriorLayout } from './steps/withExteriorLayout';
import { withGrain } from './steps/withGrain';
import { withInteriorLayout } from './steps/withInteriorLayout';
import { withItemType } from './steps/withItemType';
import { withMaterialId } from './steps/withMaterialId';
import { withMaterialsSet } from './steps/withMaterialsSet';
import { withMount } from './steps/withMount';
import { withMountType } from './steps/withMountType';
import { withPosition2D } from './steps/withPosition2D';
import { withPosition3D } from './steps/withPosition3D';
import { withRotation } from './steps/withRotation';
import { withShape } from './steps/withShape';
import { withSize } from './steps/withSize';
import { NodeCtor, WithContoursConfig, WithExteriorLayoutConfig, WithGrainConfig, WithInteriorLayoutConfig, WithItemTypeConfig, WithMaterialIdConfig, WithMaterialsSetConfig, WithMountConfig, WithMountTypeConfig, WithPosition2DConfig, WithPosition3DConfig, WithRotationConfig, WithShapeConfig, WithSizeConfig } from './types';
type ChildPropertyKey = (typeof childrenProperties)[number];
export declare class NodeBuilder<TConfig extends NodeSharedConfig, TBase extends NodeCtor<TConfig, any>> {
    private readonly base;
    private constructor();
    static create<T extends NodeSharedConfig = NodeSharedConfig>(): NodeBuilder<T, NodeCtor<T>>;
    withPosition3D(): NodeBuilder<TConfig & WithPosition3DConfig, ReturnType<typeof withPosition3D<TConfig & WithPosition3DConfig, TBase>>>;
    withPosition2D(): NodeBuilder<TConfig & WithPosition2DConfig, ReturnType<typeof withPosition2D<TConfig & WithPosition2DConfig, TBase>>>;
    withRotation(): NodeBuilder<TConfig & WithRotationConfig, ReturnType<typeof withRotation<TConfig & WithRotationConfig, TBase>>>;
    withSize(): NodeBuilder<TConfig & WithSizeConfig, ReturnType<typeof withSize<TConfig & WithSizeConfig, TBase>>>;
    withShape(): NodeBuilder<TConfig & WithShapeConfig, ReturnType<typeof withShape<TConfig & WithShapeConfig, TBase>>>;
    withContours(): NodeBuilder<TConfig & WithContoursConfig, ReturnType<typeof withContours<TConfig & WithContoursConfig, TBase>>>;
    withGrain(): NodeBuilder<TConfig & WithGrainConfig, ReturnType<typeof withGrain<TConfig & WithGrainConfig, TBase>>>;
    withProperties<TNames extends string>(namesValues: readonly TNames[]): NodeBuilder<TConfig, NodeCtor<TConfig, InstanceType<TBase> & {
        readonly properties: Map<TNames, Value<string | number | boolean | undefined>>;
    }>>;
    withMaterialId(): NodeBuilder<TConfig & WithMaterialIdConfig, ReturnType<typeof withMaterialId<TConfig & WithMaterialIdConfig, TBase>>>;
    withMount(): NodeBuilder<TConfig & WithMountConfig, ReturnType<typeof withMount<TConfig & WithMountConfig, TBase>>>;
    withMountType(): NodeBuilder<TConfig & WithMountTypeConfig, ReturnType<typeof withMountType<TConfig & WithMountTypeConfig, TBase>>>;
    withItemType(): NodeBuilder<TConfig & WithItemTypeConfig, ReturnType<typeof withItemType<TConfig & WithItemTypeConfig, TBase>>>;
    withMaterialsSet(): NodeBuilder<TConfig & WithMaterialsSetConfig, ReturnType<typeof withMaterialsSet<TConfig & WithMaterialsSetConfig, TBase>>>;
    withChildren<K extends ChildPropertyKey>(key: K): NodeBuilder<TConfig, NodeCtor<TConfig, InstanceType<TBase> & {
        readonly [P in K]: Value<UUID[]>;
    }>>;
    withAttributes(): NodeBuilder<TConfig, TBase>;
    withInteriorLayout(): NodeBuilder<TConfig & WithInteriorLayoutConfig, ReturnType<typeof withInteriorLayout<TConfig & WithInteriorLayoutConfig, TBase>>>;
    withExteriorLayout(): NodeBuilder<TConfig & WithExteriorLayoutConfig, ReturnType<typeof withExteriorLayout<TConfig & WithExteriorLayoutConfig, TBase>>>;
    toClass(): TBase;
}
export {};
