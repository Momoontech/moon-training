import type { Matrix4 } from './Matrix4';
import { Vector2 } from './Vector2';
/**
 * Custom Matrix3 class to replace Three.js Matrix3
 * Represents a 3x3 matrix in column-major order
 * Used for 2D transformations and normal matrix calculations
 */
export declare class Matrix3 {
    elements: number[];
    constructor();
    /**
     * Sets all nine values of this matrix
     * Values are in column-major order:
     * n11, n21, n31, n12, n22, n32, n13, n23, n33
     */
    set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number): this;
    /**
     * Sets this matrix to the identity matrix
     */
    identity(): this;
    /**
     * Returns a new Matrix3 with the same elements
     */
    clone(): Matrix3;
    /**
     * Copies the elements from another Matrix3
     */
    copy(m: Matrix3): this;
    /**
     * Extracts the basis vectors (2D) from this matrix
     */
    extractBasis(xAxis: Vector2, yAxis: Vector2): this;
    /**
     * Sets this matrix from the upper-left 3x3 of a Matrix4
     */
    setFromMatrix4(m: Matrix4): this;
    /**
     * Post-multiplies this matrix by m
     */
    multiply(m: Matrix3): this;
    /**
     * Pre-multiplies this matrix by m
     */
    premultiply(m: Matrix3): this;
    /**
     * Sets this matrix to a × b
     */
    multiplyMatrices(a: Matrix3, b: Matrix3): this;
    /**
     * Multiplies every element of this matrix by a scalar
     */
    multiplyScalar(s: number): this;
    /**
     * Computes the determinant of this matrix
     */
    determinant(): number;
    /**
     * Inverts this matrix
     */
    invert(): this;
    /**
     * Transposes this matrix
     */
    transpose(): this;
    /**
     * Sets this matrix as the normal matrix (transpose of the inverse) of a Matrix4
     * The normal matrix is the upper-left 3x3 of the inverse transpose
     */
    getNormalMatrix(matrix4: Matrix4): this;
    /**
     * Transposes this matrix into the supplied array
     */
    transposeIntoArray(r: number[]): this;
    /**
     * Sets the UV transform matrix from offset, repeat, rotation and center
     */
    setUvTransform(tx: number, ty: number, sx: number, sy: number, rotation: number, cx: number, cy: number): this;
    /**
     * Scales this matrix by sx and sy
     */
    scale(sx: number, sy: number): this;
    /**
     * Sets this matrix to a 2D rotation matrix
     * @param theta - Rotation angle in radians
     */
    makeRotation(theta: number): this;
    /**
     * Sets this matrix to a 2D translation matrix
     */
    makeTranslation(x: number, y: number): this;
    /**
     * Sets this matrix to a 2D scale matrix
     */
    makeScale(x: number, y: number): this;
    /**
     * Rotates this matrix by the given angle
     */
    rotate(theta: number): this;
    /**
     * Translates this matrix by x and y
     */
    translate(x: number, y: number): this;
    /**
     * Checks for strict equality with another Matrix3
     */
    equals(matrix: Matrix3): boolean;
    /**
     * Sets this matrix from an array in column-major order
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array in column-major order
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this matrix from a JSON object
     */
    fromJSON(json: {
        elements: number[];
    }): this;
    /**
     * Returns a JSON representation of this matrix
     */
    toJSON(): {
        elements: number[];
    };
    /**
     * Returns a string representation of this matrix
     */
    toString(): string;
}
