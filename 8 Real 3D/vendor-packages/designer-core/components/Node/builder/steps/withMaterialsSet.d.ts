import { NodeSharedConfig, UUID } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithMaterialsSetConfig } from '../types';
export declare const withMaterialsSet: <TConfig extends NodeSharedConfig & WithMaterialsSetConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly materialsSet: Value<UUID>;
}>;
