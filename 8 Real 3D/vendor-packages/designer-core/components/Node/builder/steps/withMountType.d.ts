import { NodeSharedConfig } from '../../../../declarations';
import { MountType } from '../../../../declarations/helpers';
import Value from '../../../Value';
import { NodeCtor, WithMountTypeConfig } from '../types';
export declare const withMountType: <TConfig extends NodeSharedConfig & WithMountTypeConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly mountTypes: Value<MountType[]>;
}>;
