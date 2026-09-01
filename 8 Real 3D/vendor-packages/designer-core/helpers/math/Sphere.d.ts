import { Box3 } from './Box3';
import './Line3';
import type { Matrix4 } from './Matrix4';
import { Plane } from './Plane';
import type { Ray } from './Ray';
import { Vector3 } from './Vector3';
/**
 * Custom Sphere class to replace Three.js Sphere
 * Represents a sphere in 3D space defined by a center point and radius
 */
export declare class Sphere {
    center: Vector3;
    radius: number;
    constructor(center?: Vector3, radius?: number);
    /**
     * Sets the center and radius of this sphere
     */
    set(center: Vector3, radius: number): this;
    /**
     * Sets this sphere from an array of points
     */
    setFromPoints(points: Vector3[], optionalCenter?: Vector3): this;
    /**
     * Returns a new Sphere with the same center and radius
     */
    clone(): Sphere;
    /**
     * Copies the center and radius from another Sphere
     */
    copy(sphere: Sphere): this;
    /**
     * Makes this sphere empty (negative radius)
     */
    makeEmpty(): this;
    /**
     * Checks if this sphere is empty (negative radius)
     */
    isEmpty(): boolean;
    /**
     * Computes a bounding box for this sphere
     */
    getBoundingBox(target?: Box3): Box3;
    /**
     * Checks if this sphere contains the given point
     */
    containsPoint(point: Vector3): boolean;
    /**
     * Computes the distance from this sphere's surface to a point
     * Returns negative if the point is inside the sphere
     */
    distanceToPoint(point: Vector3): number;
    /**
     * Checks if this sphere intersects with another sphere
     */
    intersectsSphere(sphere: Sphere): boolean;
    /**
     * Checks if this sphere intersects with a Box3
     */
    intersectsBox(box: Box3): boolean;
    /**
     * Checks if this sphere intersects with a Plane
     */
    intersectsPlane(plane: Plane): boolean;
    /**
     * Clamps a point to the surface of this sphere
     */
    clampPoint(point: Vector3, target?: Vector3): Vector3;
    /**
     * Expands this sphere to include the given point
     */
    expandByPoint(point: Vector3): this;
    /**
     * Sets this sphere to the union with another sphere
     */
    union(sphere: Sphere): this;
    /**
     * Applies a Matrix4 transformation to this sphere
     */
    applyMatrix4(matrix: Matrix4): this;
    /**
     * Translates this sphere by an offset
     */
    translate(offset: Vector3): this;
    /**
     * Expands this sphere by a delta value
     */
    expandByScalar(scalar: number): this;
    /**
     * Checks for strict equality with another sphere
     */
    equals(sphere: Sphere): boolean;
    /**
     * Sets this sphere from an array [centerX, centerY, centerZ, radius]
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [centerX, centerY, centerZ, radius]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this sphere from a JSON object
     */
    fromJSON(json: {
        center: {
            x: number;
            y: number;
            z: number;
        };
        radius: number;
    }): this;
    /**
     * Returns a JSON representation of this sphere
     */
    toJSON(): {
        center: {
            x: number;
            y: number;
            z: number;
        };
        radius: number;
    };
    /**
     * Gets the volume of this sphere
     */
    getVolume(): number;
    /**
     * Gets the surface area of this sphere
     */
    getSurfaceArea(): number;
    /**
     * Checks if a point is on the surface of this sphere (within epsilon tolerance)
     */
    isPointOnSurface(point: Vector3, epsilon?: number): boolean;
    /**
     * Gets a point on the surface of the sphere at given spherical coordinates
     * @param theta - Azimuthal angle (0 to 2π)
     * @param phi - Polar angle (0 to π)
     */
    getPointAt(theta: number, phi: number, target?: Vector3): Vector3;
    /**
     * Returns a string representation of this sphere
     */
    toString(): string;
    /**
     * Computes the distance from this sphere to a Ray
     */
    distanceToRay(ray: Ray): number;
    /**
     * Intersects this sphere with a Line3
     * Requires: Line3 class
     */
    /**
     * Checks if this sphere intersects with a Triangle
     * Requires: Triangle class
     */
    /**
     * Sets this sphere from an Object3D's bounding sphere
     * Requires: Object3D class
     */
    /**
     * Sets this sphere from a Box3
     * Note: This creates a bounding sphere, not the minimal sphere
     */
    setFromBox3(box: Box3): this;
}
