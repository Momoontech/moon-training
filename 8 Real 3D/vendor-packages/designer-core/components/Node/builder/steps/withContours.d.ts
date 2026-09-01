import { NodeSharedConfig } from '../../../../declarations';
import ShapeValue from '../../../ShapeValue';
import { NodeCtor, WithContoursConfig } from '../types';
export declare const withContours: <TConfig extends NodeSharedConfig & WithContoursConfig, TBase extends NodeCtor<TConfig>>(Base: TBase) => NodeCtor<TConfig, InstanceType<TBase> & {
    readonly contour: ShapeValue;
    readonly contourLeft: ShapeValue;
    readonly contourRight: ShapeValue;
    readonly contourLeftRight: ShapeValue;
}>;
