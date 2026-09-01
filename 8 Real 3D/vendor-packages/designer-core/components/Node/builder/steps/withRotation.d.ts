import { NodeSharedConfig, V3Axes } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithRotationConfig } from '../types';
export declare const withRotation: <TConfig extends NodeSharedConfig & WithRotationConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly rotation: Record<V3Axes, Value<number>>;
}>;
