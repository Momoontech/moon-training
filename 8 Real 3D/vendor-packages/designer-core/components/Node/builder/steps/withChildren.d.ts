import { NodeSharedConfig, UUID } from '../../../../declarations';
import { IValue } from '../../../../declarations/IValue';
import Value from '../../../Value';
import { childrenProperties } from '../../helpers/childrenProperties';
import { NodeCtor } from '../types';
type ChildPropertyKey = (typeof childrenProperties)[number];
export declare const withChildren: <K extends ChildPropertyKey, TConfig extends NodeSharedConfig & { [P_1 in K]?: IValue<UUID[]> | UUID[]; }, TBase extends NodeCtor<TConfig>>(key: K, Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & { readonly [P in K]: Value<UUID[]>; }>;
export {};
