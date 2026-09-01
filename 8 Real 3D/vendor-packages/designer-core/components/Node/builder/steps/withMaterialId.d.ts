import { NodeSharedConfig, UUID } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithMaterialIdConfig } from '../types';
export declare const withMaterialId: <TConfig extends NodeSharedConfig & WithMaterialIdConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly materialId: Value<UUID | undefined>;
}>;
