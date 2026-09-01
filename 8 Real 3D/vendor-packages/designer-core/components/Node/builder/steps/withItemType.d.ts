import { NodeSharedConfig } from '../../../../declarations';
import { ItemType } from '../../../../declarations/helpers';
import Value from '../../../Value';
import { NodeCtor, WithItemTypeConfig } from '../types';
export declare const withItemType: <TConfig extends NodeSharedConfig & WithItemTypeConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly itemType: Value<ItemType>;
}>;
