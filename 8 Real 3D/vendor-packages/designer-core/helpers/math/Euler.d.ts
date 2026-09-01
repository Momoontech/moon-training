import { Matrix4 } from './Matrix4';
import type { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
/**
 * Custom Euler class to replace Three.js Euler
 * Represents rotation as three angles around x, y, and z axes
 * Uses intrinsic Tait-Bryan angles (angles applied in a specific order)
 */
export type EulerOrder = 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';
export declare const DefaultEulerOrder: EulerOrder;
export declare class Euler {
    x: number;
    y: number;
    z: number;
    order: EulerOrder;
    constructor(x?: number, y?: number, z?: number, order?: EulerOrder);
    /**
     * Sets the x, y, z angles and rotation order
     */
    set(x: number, y: number, z: number, order?: EulerOrder): this;
    /**
     * Returns a new Euler with the same x, y, z, order values
     */
    clone(): Euler;
    /**
     * Copies the values from another Euler
     */
    copy(euler: Euler): this;
    /**
     * Reorders this Euler angles to a different order
     */
    reorder(newOrder: EulerOrder): this;
    /**
     * Checks for strict equality with euler
     */
    equals(euler: Euler): boolean;
    /**
     * Sets this Euler from an array
     */
    fromArray(array: any[], offset?: number): this;
    /**
     * Returns an array [x, y, z, order]
     */
    toArray(array?: any[], offset?: number): any[];
    /**
     * Converts Euler angles to a [pitch, yaw, roll] array (common in aviation)
     * Note: This is just a convenience method that returns angles in a different naming convention
     */
    toPitchYawRoll(): {
        pitch: number;
        yaw: number;
        roll: number;
    };
    /**
     * Sets Euler angles from pitch, yaw, roll values
     */
    fromPitchYawRoll(pitch: number, yaw: number, roll: number, order?: EulerOrder): this;
    /**
     * Converts angles to degrees (returns new object with degree values)
     */
    toDegrees(): {
        x: number;
        y: number;
        z: number;
        order: EulerOrder;
    };
    /**
     * Sets from degree values
     */
    fromDegrees(x: number, y: number, z: number, order?: EulerOrder): this;
    /**
     * Normalizes angles to the range [-π, π]
     */
    normalize(): this;
    /**
     * Clamps each angle component between min and max
     */
    clamp(min: number, max: number): this;
    /**
     * Negates all angle components
     */
    negate(): this;
    /**
     * Adds euler angles component-wise
     * Note: This is mathematically incorrect for general rotations but useful for incremental updates
     */
    add(euler: Euler): this;
    /**
     * Subtracts euler angles component-wise
     * Note: This is mathematically incorrect for general rotations but useful for incremental updates
     */
    sub(euler: Euler): this;
    /**
     * Scales all angle components by a scalar
     */
    multiplyScalar(scalar: number): this;
    /**
     * Linearly interpolates between this Euler and target
     * Note: This is not a proper rotation interpolation (use Quaternion.slerp for that)
     * But it's useful for simple animations where gimbal lock is not an issue
     */
    lerp(target: Euler, alpha: number): this;
    /**
     * Returns a string representation of this Euler
     */
    toString(): string;
    /**
     * Sets this Euler from a rotation matrix
     * Assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
     */
    setFromRotationMatrix(m: Matrix4, order?: EulerOrder): this;
    /**
     * Sets this Euler from a Quaternion
     */
    setFromQuaternion(q: Quaternion, order?: EulerOrder): this;
    /**
     * Sets this Euler from a Vector3 (just copies x, y, z values)
     */
    setFromVector3(v: Vector3, order?: EulerOrder): this;
    /**
     * Converts this Euler to a Vector3 (just extracts x, y, z)
     */
    toVector3(target?: Vector3): Vector3;
}
