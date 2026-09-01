import './Line3';
import type { Matrix4 } from './Matrix4';
import type { Plane } from './Plane';
import './Ray';
import type { Sphere } from './Sphere';
import './Triangle';
import { Vector3 } from './Vector3';
/**
 * Custom Box3 class to replace Three.js Box3
 * Represents an axis-aligned bounding box (AABB) in 3D space
 * Defined by min and max points
 */
export declare class Box3 {
    min: Vector3;
    max: Vector3;
    constructor(min?: Vector3, max?: Vector3);
    /**
     * Sets the min and max points of this box
     */
    set(min: Vector3, max: Vector3): this;
    /**
     * Sets this box from an array of points
     */
    setFromPoints(points: Vector3[]): this;
    /**
     * Sets this box from center and size
     */
    setFromCenterAndSize(center: Vector3, size: Vector3): this;
    /**
     * Returns a new Box3 with the same min and max
     */
    clone(): Box3;
    /**
     * Copies the min and max from another Box3
     */
    copy(box: Box3): this;
    /**
     * Makes this box empty (inverted bounds)
     */
    makeEmpty(): this;
    /**
     * Checks if this box is empty
     */
    isEmpty(): boolean;
    /**
     * Gets the center point of this box
     */
    getCenter(target?: Vector3): Vector3;
    /**
     * Gets the size (width, height, depth) of this box
     */
    getSize(target?: Vector3): Vector3;
    /**
     * Expands this box to include the given point
     */
    expandByPoint(point: Vector3): this;
    /**
     * Expands this box by the given vector (adds to both min and max in opposite directions)
     */
    expandByVector(vector: Vector3): this;
    /**
     * Expands this box by a scalar (adds to both min and max in opposite directions)
     */
    expandByScalar(scalar: number): this;
    /**
     * Checks if this box contains the given point
     */
    containsPoint(point: Vector3): boolean;
    /**
     * Checks if this box contains the given box
     */
    containsBox(box: Box3): boolean;
    /**
     * Gets a parameter representing the position of a point within this box
     */
    getParameter(point: Vector3, target?: Vector3): Vector3;
    /**
     * Checks if this box intersects with another box
     */
    intersectsBox(box: Box3): boolean;
    /**
     * Clamps a point within this box
     */
    clampPoint(point: Vector3, target?: Vector3): Vector3;
    /**
     * Gets the distance from this box to a point
     * If the point is inside the box, returns 0
     */
    distanceToPoint(point: Vector3): number;
    /**
     * Sets this box to the intersection with another box
     */
    intersect(box: Box3): this;
    /**
     * Sets this box to the union with another box
     */
    union(box: Box3): this;
    /**
     * Applies a Matrix4 transformation to this box
     */
    applyMatrix4(matrix: Matrix4): this;
    /**
     * Translates this box by an offset
     */
    translate(offset: Vector3): this;
    /**
     * Checks for strict equality with another box
     */
    equals(box: Box3): boolean;
    /**
     * Sets this box from an array [minX, minY, minZ, maxX, maxY, maxZ]
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [minX, minY, minZ, maxX, maxY, maxZ]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this box from a JSON object
     */
    fromJSON(json: {
        min: {
            x: number;
            y: number;
            z: number;
        };
        max: {
            x: number;
            y: number;
            z: number;
        };
    }): this;
    /**
     * Returns a JSON representation of this box
     */
    toJSON(): {
        min: {
            x: number;
            y: number;
            z: number;
        };
        max: {
            x: number;
            y: number;
            z: number;
        };
    };
    /**
     * Gets all eight corner points of this box
     */
    getCorners(target?: Vector3[]): Vector3[];
    /**
     * Gets the volume of this box
     */
    getVolume(): number;
    /**
     * Gets the surface area of this box
     */
    getSurfaceArea(): number;
    /**
     * Gets the diagonal length of this box
     */
    getDiagonalLength(): number;
    /**
     * Checks if a point is on the boundary of this box
     */
    isPointOnBoundary(point: Vector3, epsilon?: number): boolean;
    /**
     * Scales this box around its center
     */
    scale(scalar: number): this;
    /**
     * Returns a string representation of this box
     */
    toString(): string;
    /**
     * Sets this box from a BufferAttribute
     * Requires: BufferAttribute class
     */
    /**
     * Sets this box to enclose a sphere
     */
    setFromSphere(sphere: Sphere): this;
    /**
     * Checks if this box intersects with a sphere
     */
    intersectsSphere(sphere: Sphere): boolean;
    /**
     * Checks if this box intersects with a plane
     */
    intersectsPlane(plane: Plane): boolean;
    /**
     * Gets a bounding sphere that encompasses this box
     */
    getBoundingSphere(target: Sphere): Sphere;
}
