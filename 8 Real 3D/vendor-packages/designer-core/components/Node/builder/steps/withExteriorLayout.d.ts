import { ContainerLayout, NodeSharedConfig } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithExteriorLayoutConfig } from '../types';
export declare const withExteriorLayout: <TConfig extends NodeSharedConfig & WithExteriorLayoutConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly exteriorLayout: Value<ContainerLayout>;
}>;
