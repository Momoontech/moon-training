import { NodeSharedConfig, V2Axes } from '../../../../declarations';
import TransformedValue from '../../../Value/TransformedValue';
import Value from '../../../Value';
import { NodeCtor, WithPosition2DConfig } from '../types';
export type Position2D = {
    [V2Axes.x]: Value<number>;
    [V2Axes.y]: TransformedValue<number>;
};
export declare const withPosition2D: <TConfig extends NodeSharedConfig & WithPosition2DConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly position: Position2D;
}>;
