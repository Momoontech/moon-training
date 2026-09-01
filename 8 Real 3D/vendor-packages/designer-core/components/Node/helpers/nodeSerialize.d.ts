import { V2Axes, V3Axes } from '../../../declarations';
import Value from '../../Value';
/**
 * Serialize a `Record<V3Axes, Value<number>>` to a plain `{ x, y, z }` for `toJSON()`.
 * Uses `getSignal()` to preserve formula references rather than resolved values.
 */
export declare const serializeV3: (v: Record<V3Axes, Value<number>>) => {
    x: import("../../..").IValue<number>;
    y: import("../../..").IValue<number>;
    z: import("../../..").IValue<number>;
};
/**
 * Serialize a `Record<V2Axes, Value<number>>` to a plain `{ x, y }` for `toJSON()`.
 * Uses `getSignal()` to preserve formula references rather than resolved values.
 */
export declare const serializeV2: (v: Record<V2Axes, Value<number>>) => {
    x: import("../../..").IValue<number>;
    y: import("../../..").IValue<number>;
};
