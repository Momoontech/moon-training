import { NodeSharedConfig, V3Axes } from '../../../../declarations';
import { InterpretedVector3 } from '../../../../declarations/InterpretedVector3';
import { CoreDesigner } from '../../../../designer-core';
import Value, { ValueOptionsType } from '../../../Value';
import { NodeCtor, WithPosition3DConfig } from '../types';
export declare const initV3Record: (core: CoreDesigner, v: InterpretedVector3, options: ValueOptionsType) => Record<V3Axes, Value<number>>;
export declare const withPosition3D: <TConfig extends NodeSharedConfig & WithPosition3DConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly position: Record<V3Axes, Value<number>>;
}>;
