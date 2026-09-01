import type { Box2 } from './Box2';
import type { Matrix3 } from './Matrix3';
import type { Matrix4 } from './Matrix4';
/**
 * Custom Vector2 class to replace Three.js Vector2
 * Implements all standalone math methods without requiring other Three.js dependencies
 */
export declare class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    /**
     * Getters for width/height aliases
     */
    get width(): number;
    set width(value: number);
    get height(): number;
    set height(value: number);
    /**
     * Sets the x and y components of this vector
     */
    set(x: number, y: number): this;
    /**
     * Sets both components to the same scalar value
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
     * Sets a component by index (0 = x, 1 = y)
     */
    setComponent(index: number, value: number): this;
    /**
     * Gets a component by index (0 = x, 1 = y)
     */
    getComponent(index: number): number;
    /**
     * Returns a new Vector2 with the same x and y values
     */
    clone(): Vector2;
    /**
     * Copies the values from another Vector2
     */
    copy(v: Vector2): this;
    /**
     * Adds v to this vector
     */
    add(v: Vector2): this;
    /**
     * Adds a scalar to both components
     */
    addScalar(s: number): this;
    /**
     * Sets this vector to a + b
     */
    addVectors(a: Vector2, b: Vector2): this;
    /**
     * Adds the scaled vector v to this vector
     */
    addScaledVector(v: Vector2, s: number): this;
    /**
     * Subtracts v from this vector
     */
    sub(v: Vector2): this;
    /**
     * Subtracts a scalar from both components
     */
    subScalar(s: number): this;
    /**
     * Sets this vector to a - b
     */
    subVectors(a: Vector2, b: Vector2): this;
    /**
     * Multiplies this vector by v component-wise
     */
    multiply(v: Vector2): this;
    /**
     * Multiplies both components by a scalar
     */
    multiplyScalar(scalar: number): this;
    /**
     * Divides this vector by v component-wise
     */
    divide(v: Vector2): this;
    /**
     * Divides both components by a scalar
     */
    divideScalar(scalar: number): this;
    /**
     * Sets this vector's components to the minimum of this and v's components
     */
    min(v: Vector2): this;
    /**
     * Sets this vector's components to the maximum of this and v's components
     */
    max(v: Vector2): this;
    /**
     * Clamps this vector's components between min and max
     */
    clamp(min: Vector2, max: Vector2): this;
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
     * Negates both components
     */
    negate(): this;
    /**
     * Computes the dot product with v
     */
    dot(v: Vector2): number;
    /**
     * Computes the cross product with v (returns scalar for 2D)
     */
    cross(v: Vector2): number;
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
     * Computes the angle in radians with respect to the positive x-axis
     */
    angle(): number;
    /**
     * Computes the angle between this vector and v in radians
     */
    angleTo(v: Vector2): number;
    /**
     * Computes the squared distance to v
     */
    distanceToSquared(v: Vector2): number;
    /**
     * Computes the distance to v
     */
    distanceTo(v: Vector2): number;
    /**
     * Computes the Manhattan distance to v
     */
    manhattanDistanceTo(v: Vector2): number;
    /**
     * Sets the length of this vector to the specified value
     */
    setLength(length: number): this;
    /**
     * Linearly interpolates between this vector and v by alpha
     */
    lerp(v: Vector2, alpha: number): this;
    /**
     * Sets this vector to be the linear interpolation between v1 and v2
     */
    lerpVectors(v1: Vector2, v2: Vector2, alpha: number): this;
    /**
     * Checks for strict equality with v
     */
    equals(v: Vector2): boolean;
    /**
     * Sets this vector from an array
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [x, y]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets components from a BufferAttribute
     */
    fromBufferAttribute(attribute: any, index: number): this;
    /**
     * Rotates this vector around center by angle radians
     */
    rotateAround(center: Vector2 | undefined, angle: number): this;
    /**
     * Sets this vector to a random direction with unit length
     */
    random(): this;
    /**
     * Sets this vector to a random position inside a unit circle
     */
    randomInUnitCircle(): this;
    /**
     * Applies a Matrix3 transformation to this vector
     */
    applyMatrix3(m: Matrix3): this;
    /**
     * Transforms this vector by a 4x3 affine transformation matrix
     */
    applyMatrix4(m: Matrix4): this;
    /**
     * Multiplies this vector (with an implicit 1 as the 3rd component) by m
     * Requires: Matrix3 class
     */
    /**
     * Clamps this vector to the boundaries of a Box2
     */
    clampBox(box: Box2): this;
}
