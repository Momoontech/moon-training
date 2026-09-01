import { NodeSharedConfig } from '../../../../declarations';
import { NodeCtor } from '../types';
export declare const withAttributes: <TConfig extends NodeSharedConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase>>;
