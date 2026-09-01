import { MountType, NodeSharedConfig } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor, WithMountConfig } from '../types';
export declare const withMount: <TConfig extends NodeSharedConfig & WithMountConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly mountSlotTypes: Value<MountType[]>;
}>;
