import { ContainerLayout, NodeSharedConfig } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithInteriorLayoutConfig } from '../types';
export declare const withInteriorLayout: <TConfig extends NodeSharedConfig & WithInteriorLayoutConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly interiorLayout: Value<ContainerLayout>;
}>;
