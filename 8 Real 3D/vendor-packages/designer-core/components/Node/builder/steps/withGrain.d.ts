import { NodeSharedConfig, V2Axes } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithGrainConfig } from '../types';
export declare const withGrain: <TConfig extends NodeSharedConfig & WithGrainConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly grainDirection: Value<number>;
    readonly grainOffset?: Record<V2Axes, Value<number>>;
}>;
