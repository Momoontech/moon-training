import type { Box3 } from './Box3';
import type { Euler } from './Euler';
import type { Matrix4 } from './Matrix4';
import { Quaternion } from './Quaternion';
/**
 * Custom Vector3 class to replace Three.js Vector3
 * Implements all standalone math methods without requiring other Three.js dependencies
 */
export declare class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    /**
     * Sets the x, y, and z components of this vector
     */
    set(x: number, y: number, z: number): this;
    /**
     * Sets all components to the same scalar value
     */
    setScalar(scalar: number): this;
    /**
     * Sets the x component
     */
    setX(x: number): this;
    /**
     * Sets the y component
     */
    setY(y: number): this;
    /**
     * Sets the z component
     */
    setZ(z: number): this;
    /**
     * Sets a component by index (0 = x, 1 = y, 2 = z)
     */
    setComponent(index: number, value: number): this;
    /**
     * Gets a component by index (0 = x, 1 = y, 2 = z)
     */
    getComponent(index: number): number;
    /**
     * Returns a new Vector3 with the same x, y, and z values
     */
    clone(): Vector3;
    /**
     * Copies the values from another Vector3
     */
    copy(v: Vector3): this;
    /**
     * Adds v to this vector
     */
    add(v: Vector3): this;
    /**
     * Adds a scalar to all components
     */
    addScalar(s: number): this;
    /**
     * Sets this vector to a + b
     */
    addVectors(a: Vector3, b: Vector3): this;
    /**
     * Adds the scaled vector v to this vector
     */
    addScaledVector(v: Vector3, s: number): this;
    /**
     * Subtracts v from this vector
     */
    sub(v: Vector3): this;
    /**
     * Subtracts a scalar from all components
     */
    subScalar(s: number): this;
    /**
     * Sets this vector to a - b
     */
    subVectors(a: Vector3, b: Vector3): this;
    /**
     * Multiplies this vector by v component-wise
     */
    multiply(v: Vector3): this;
    /**
     * Multiplies all components by a scalar
     */
    multiplyScalar(scalar: number): this;
    /**
     * Multiplies this vector by m component-wise
     */
    multiplyVectors(a: Vector3, b: Vector3): this;
    /**
     * Divides this vector by v component-wise
     */
    divide(v: Vector3): this;
    /**
     * Divides all components by a scalar
     */
    divideScalar(scalar: number): this;
    /**
     * Sets this vector's components to the minimum of this and v's components
     */
    min(v: Vector3): this;
    /**
     * Sets this vector's components to the maximum of this and v's components
     */
    max(v: Vector3): this;
    /**
     * Clamps this vector's components between min and max
     */
    clamp(min: Vector3, max: Vector3): this;
    /**
     * Clamps this vector's components between minVal and maxVal
     */
    clampScalar(minVal: number, maxVal: number): this;
    /**
     * Clamps this vector's length between min and max
     */
    clampLength(min: number, max: number): this;
    /**
     * Rounds down each component to the nearest integer
     */
    floor(): this;
    /**
     * Rounds up each component to the nearest integer
     */
    ceil(): this;
    /**
     * Rounds each component to the nearest integer
     */
    round(): this;
    /**
     * Rounds each component towards zero (down if positive, up if negative)
     */
    roundToZero(): this;
    /**
     * Negates all components
     */
    negate(): this;
    /**
     * Computes the dot product with v
     */
    dot(v: Vector3): number;
    /**
     * Computes the squared length of this vector
     */
    lengthSq(): number;
    /**
     * Computes the length of this vector
     */
    length(): number;
    /**
     * Computes the Manhattan length (taxicab distance)
     */
    manhattanLength(): number;
    /**
     * Normalizes this vector (makes it unit length)
     */
    normalize(): this;
    /**
     * Sets the length of this vector to the specified value
     */
    setLength(length: number): this;
    /**
     * Linearly interpolates between this vector and v by alpha
     */
    lerp(v: Vector3, alpha: number): this;
    /**
     * Sets this vector to be the linear interpolation between v1 and v2
     */
    lerpVectors(v1: Vector3, v2: Vector3, alpha: number): this;
    /**
     * Sets this vector to the cross product of itself and v
     */
    cross(v: Vector3): this;
    /**
     * Sets this vector to the cross product of a and b
     */
    crossVectors(a: Vector3, b: Vector3): this;
    /**
     * Computes the angle between this vector and v in radians
     */
    angleTo(v: Vector3): number;
    /**
     * Computes the squared distance to v
     */
    distanceToSquared(v: Vector3): number;
    /**
     * Computes the distance to v
     */
    distanceTo(v: Vector3): number;
    /**
     * Computes the Manhattan distance to v
     */
    manhattanDistanceTo(v: Vector3): number;
    /**
     * Sets this vector from spherical coordinates
     */
    setFromSpherical(s: {
        radius: number;
        phi: number;
        theta: number;
    }): this;
    /**
     * Sets this vector from spherical coordinates (radius, phi, theta)
     */
    setFromSphericalCoords(radius: number, phi: number, theta: number): this;
    /**
     * Sets this vector from cylindrical coordinates
     */
    setFromCylindrical(c: {
        radius: number;
        theta: number;
        y: number;
    }): this;
    /**
     * Sets this vector from cylindrical coordinates (radius, theta, y)
     */
    setFromCylindricalCoords(radius: number, theta: number, y: number): this;
    /**
     * Checks for strict equality with v
     */
    equals(v: Vector3): boolean;
    /**
     * Sets this vector from an array
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [x, y, z]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets components from a BufferAttribute
     */
    fromBufferAttribute(attribute: any, index: number): this;
    /**
     * Sets this vector to a random direction with unit length
     */
    random(): this;
    /**
     * Sets this vector to a random position inside a unit sphere
     */
    randomInUnitSphere(): this;
    /**
     * Generates a random direction and scales it by the radius
     */
    randomDirection(): this;
    /**
     * Applies a Matrix3 transformation to this vector
     * Requires: Matrix3 class
     */
    /**
     * Multiplies this vector by the upper 3x3 of m
     * Requires: Matrix3 class
     */
    /**
     * Applies a Matrix4 transformation to this vector
     */
    applyMatrix4(m: Matrix4): this;
    /**
     * Applies a Quaternion transformation to this vector
     */
    applyQuaternion(q: Quaternion): this;
    /**
     * Applies an Euler transformation to this vector
     */
    applyEuler(euler: Euler): this;
    /**
     * Applies an axis-angle rotation to this vector
     */
    applyAxisAngle(axis: Vector3, angle: number): this;
    /**
     * Transforms the direction of this vector by a matrix
     */
    transformDirection(m: Matrix4): this;
    /**
     * Projects this vector onto a plane defined by a normal
     */
    projectOnPlane(planeNormal: Vector3): this;
    /**
     * Projects this vector onto another vector
     */
    projectOnVector(v: Vector3): this;
    /**
     * Reflects this vector off a plane defined by a normal
     */
    reflect(normal: Vector3): this;
    /**
     * Sets this vector from a matrix position (column 3)
     */
    setFromMatrixPosition(m: Matrix4): this;
    /**
     * Sets this vector from the scale component of a matrix
     */
    setFromMatrixScale(m: Matrix4): this;
    /**
     * Sets this vector from a matrix column
     */
    setFromMatrixColumn(m: Matrix4, index: number): this;
    /**
     * Sets this vector from a Matrix3 column
     * Requires: Matrix3 class
     */
    /**
     * Clamps this vector within a Box3
     */
    clampBox(box: Box3): this;
    /**
     * Projects this 3D vector to 2D screen space
     * Requires: Camera class
     */
    project(matrixWorld: Matrix4, projectionMatrix: Matrix4): this;
    /**
     * Unprojects this 2D screen point to 3D space
     * Requires: Camera class
     */
    unproject(matrixWorld: Matrix4, projectionMatrix: Matrix4): this;
}
