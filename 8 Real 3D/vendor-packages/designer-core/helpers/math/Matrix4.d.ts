import type { Euler } from './Euler';
import type { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
/**
 * Custom Matrix4 class to replace Three.js Matrix4
 * Implements a 4x4 matrix in column-major order
 * Elements are stored as: [m11, m21, m31, m41, m12, m22, m32, m42, m13, m23, m33, m43, m14, m24, m34, m44]
 */
export declare class Matrix4 {
    elements: number[];
    constructor();
    /**
     * Sets all 16 matrix elements in row-major order
     */
    set(n11: number, n12: number, n13: number, n14: number, n21: number, n22: number, n23: number, n24: number, n31: number, n32: number, n33: number, n34: number, n41: number, n42: number, n43: number, n44: number): this;
    /**
     * Sets this matrix to the identity matrix
     */
    identity(): this;
    /**
     * Returns a new Matrix4 with the same elements
     */
    clone(): Matrix4;
    /**
     * Copies the elements from another Matrix4
     */
    copy(m: Matrix4): this;
    /**
     * Copies the position (translation) from a Matrix4
     */
    copyPosition(m: Matrix4): this;
    /**
     * Sets the basis vectors from another matrix
     */
    extractBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this;
    /**
     * Sets this matrix from basis vectors
     */
    makeBasis(xAxis: Vector3, yAxis: Vector3, zAxis: Vector3): this;
    /**
     * Sets this matrix to a rotation around the X axis
     */
    makeRotationX(theta: number): this;
    /**
     * Sets this matrix to a rotation around the Y axis
     */
    makeRotationY(theta: number): this;
    /**
     * Sets this matrix to a rotation around the Z axis
     */
    makeRotationZ(theta: number): this;
    /**
     * Sets this matrix to a rotation around an arbitrary axis
     */
    makeRotationAxis(axis: Vector3, angle: number): this;
    /**
     * Sets this matrix to a scale transformation
     */
    makeScale(x: number, y: number, z: number): this;
    /**
     * Sets this matrix to a shear transformation
     */
    makeShear(xy: number, xz: number, yx: number, yz: number, zx: number, zy: number): this;
    /**
     * Sets this matrix to a translation transformation
     */
    makeTranslation(x: number, y: number, z: number): this;
    /**
     * Multiplies this matrix by m
     */
    multiply(m: Matrix4): this;
    /**
     * Multiplies m by this matrix
     */
    premultiply(m: Matrix4): this;
    /**
     * Sets this matrix to a * b
     */
    multiplyMatrices(a: Matrix4, b: Matrix4): this;
    /**
     * Multiplies every element by a scalar
     */
    multiplyScalar(s: number): this;
    /**
     * Computes the determinant of this matrix
     */
    determinant(): number;
    /**
     * Transposes this matrix
     */
    transpose(): this;
    /**
     * Sets this matrix to the position from a transformation matrix
     */
    setPosition(x: number | Vector3, y?: number, z?: number): this;
    /**
     * Inverts this matrix
     */
    invert(): this;
    /**
     * Scales this matrix
     */
    scale(v: Vector3): this;
    /**
     * Gets the maximum scale value from this matrix
     */
    getMaxScaleOnAxis(): number;
    /**
     * Sets this matrix to a perspective projection matrix
     */
    makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number, coordinateSystem?: number): this;
    /**
     * Sets this matrix to an orthographic projection matrix
     */
    makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number, coordinateSystem?: number): this;
    /**
     * Checks for strict equality with m
     */
    equals(matrix: Matrix4): boolean;
    /**
     * Sets this matrix from an array
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [e0, e1, ..., e15]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Decomposes this matrix into position, quaternion and scale components
     */
    decompose(position: Vector3, quaternion: Quaternion, scale: Vector3): this;
    /**
     * Composes this matrix from position, quaternion and scale
     */
    compose(position: Vector3, quaternion: Quaternion, scale: Vector3): this;
    /**
     * Sets this matrix from a Quaternion rotation
     */
    makeRotationFromQuaternion(q: Quaternion): this;
    /**
     * Sets this matrix to a "look-at" transformation
     */
    lookAt(eye: Vector3, target: Vector3, up: Vector3): this;
    /**
     * Sets this matrix from an Euler rotation
     */
    makeRotationFromEuler(euler: Euler): this;
    /**
     * Extracts the rotation from this matrix (removes scale)
     */
    extractRotation(m: Matrix4): this;
}
