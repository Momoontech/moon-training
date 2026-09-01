import { NodeSharedConfig, V3Axes } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithSizeConfig } from '../types';
export declare const withSize: <TConfig extends NodeSharedConfig & WithSizeConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly size: Record<V3Axes, Value<number>>;
}>;
