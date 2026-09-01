import type { Euler } from './Euler';
import type { Matrix4 } from './Matrix4';
import type { Vector3 } from './Vector3';
/**
 * Custom Quaternion class to replace Three.js Quaternion
 * Implements quaternion math for 3D rotations
 * Format: x, y, z, w where w is the real part
 */
export declare class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    /**
     * Sets the x, y, z, w components of this quaternion
     */
    set(x: number, y: number, z: number, w: number): this;
    /**
     * Returns a new Quaternion with the same x, y, z, w values
     */
    clone(): Quaternion;
    /**
     * Copies the values from another Quaternion
     */
    copy(quaternion: Quaternion): this;
    /**
     * Sets this quaternion from axis and angle
     * Assumes axis is normalized
     */
    setFromAxisAngle(axis: Vector3, angle: number): this;
    /**
     * Sets this quaternion from rotation specified by unit vectors
     */
    setFromUnitVectors(vFrom: Vector3, vTo: Vector3): this;
    /**
     * Computes the angle between this quaternion and q in radians
     */
    angleTo(q: Quaternion): number;
    /**
     * Rotates this quaternion by a given angular step to q
     */
    rotateTowards(q: Quaternion, step: number): this;
    /**
     * Sets this quaternion to the identity quaternion
     */
    identity(): this;
    /**
     * Inverts this quaternion
     */
    invert(): this;
    /**
     * Conjugates this quaternion
     */
    conjugate(): this;
    /**
     * Computes the dot product with q
     */
    dot(v: Quaternion): number;
    /**
     * Computes the squared length of this quaternion
     */
    lengthSq(): number;
    /**
     * Computes the length of this quaternion
     */
    length(): number;
    /**
     * Normalizes this quaternion (makes it unit length)
     */
    normalize(): this;
    /**
     * Multiplies this quaternion by q
     */
    multiply(q: Quaternion): this;
    /**
     * Multiplies q by this quaternion
     */
    premultiply(q: Quaternion): this;
    /**
     * Sets this quaternion to a * b
     */
    multiplyQuaternions(a: Quaternion, b: Quaternion): this;
    /**
     * Spherical linear interpolation between this quaternion and q
     */
    slerp(qb: Quaternion, t: number): this;
    /**
     * Sets this quaternion to the slerp result of qa and qb
     */
    slerpQuaternions(qa: Quaternion, qb: Quaternion, t: number): this;
    /**
     * Performs a random quaternion generation
     */
    random(): this;
    /**
     * Checks for strict equality with q
     */
    equals(quaternion: Quaternion): boolean;
    /**
     * Sets this quaternion from an array
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [x, y, z, w]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets components from a BufferAttribute
     */
    fromBufferAttribute(attribute: any, index: number): this;
    /**
     * Converts quaternion to [axis, angle] representation
     */
    toAxisAngle(targetAxis: Vector3): {
        axis: Vector3;
        angle: number;
    };
    /**
     * Sets this quaternion from Euler angles
     */
    setFromEuler(euler: Euler): this;
    /**
     * Sets this quaternion from a rotation matrix
     * Assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
     */
    setFromRotationMatrix(m: Matrix4): this;
}
