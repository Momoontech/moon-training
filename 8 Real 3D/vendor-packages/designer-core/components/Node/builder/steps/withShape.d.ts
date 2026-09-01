import { NodeSharedConfig } from '../../../../declarations';
import ShapeValue from '../../../ShapeValue';
import { NodeCtor, WithShapeConfig } from '../types';
export declare const withShape: <TConfig extends NodeSharedConfig & WithShapeConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly shape: ShapeValue;
}>;
