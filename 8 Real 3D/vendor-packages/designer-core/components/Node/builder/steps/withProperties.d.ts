import { NodeSharedConfig } from '../../../../declarations';
import Value from '../../../Value';
import { NodeCtor } from '../types';
export declare const withProperties: <TNames extends string>(namesValues: readonly TNames[]) => <TConfig extends NodeSharedConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly properties: Map<TNames, Value<string | number | boolean | undefined>>;
}>;
