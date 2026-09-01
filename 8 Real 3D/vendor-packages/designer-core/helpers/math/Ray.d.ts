import type { Box3 } from './Box3';
import type { Matrix4 } from './Matrix4';
import type { Plane } from './Plane';
import type { Sphere } from './Sphere';
import type { Triangle } from './Triangle';
import { Vector3 } from './Vector3';
/**
 * Custom Ray class to replace Three.js Ray
 * Represents a ray in 3D space defined by an origin point and a direction vector
 * The ray equation is: origin + t * direction (where t >= 0)
 */
export declare class Ray {
    origin: Vector3;
    direction: Vector3;
    constructor(origin?: Vector3, direction?: Vector3);
    /**
     * Sets the origin and direction of this ray
     */
    set(origin: Vector3, direction: Vector3): this;
    /**
     * Returns a new Ray with the same origin and direction
     */
    clone(): Ray;
    /**
     * Copies the origin and direction from another Ray
     */
    copy(ray: Ray): this;
    /**
     * Gets a point at a distance t along the ray
     * @param t - Distance along the ray (t >= 0)
     */
    at(t: number, target?: Vector3): Vector3;
    /**
     * Sets the direction to point from the origin to the target
     */
    lookAt(target: Vector3): this;
    /**
     * Shifts the origin of the ray along its direction by distance t
     */
    recast(t: number): this;
    /**
     * Finds the closest point on the ray to a given point
     */
    closestPointToPoint(point: Vector3, target?: Vector3): Vector3;
    /**
     * Gets the squared distance from the ray to a point
     */
    distanceSqToPoint(point: Vector3): number;
    /**
     * Gets the distance from the ray to a point
     */
    distanceToPoint(point: Vector3): number;
    /**
     * Gets the squared distance from the ray to a plane
     */
    distanceSqToPlane(plane: Plane): number;
    /**
     * Gets the distance from the ray to a plane
     */
    distanceToPlane(plane: Plane): number;
    /**
     * Intersects this ray with a plane
     * Returns the intersection point or null if no intersection
     */
    intersectPlane(plane: Plane, target?: Vector3): Vector3 | null;
    /**
     * Checks if this ray intersects a plane
     */
    intersectsPlane(plane: Plane): boolean;
    /**
     * Intersects this ray with a Box3
     * Returns the intersection point or null if no intersection
     */
    intersectBox(box: Box3, target?: Vector3): Vector3 | null;
    /**
     * Checks if this ray intersects a Box3
     */
    intersectsBox(box: Box3): boolean;
    /**
     * Intersects this ray with a Sphere
     * Returns the intersection point or null if no intersection
     */
    intersectSphere(sphere: Sphere, target?: Vector3): Vector3 | null;
    /**
     * Checks if this ray intersects a Sphere
     */
    intersectsSphere(sphere: Sphere): boolean;
    /**
     * Intersects this ray with a Triangle using Möller–Trumbore algorithm
     * Returns the intersection point or null if no intersection
     */
    intersectTriangle(triangle: Triangle, backfaceCulling: boolean, target?: Vector3): Vector3 | null;
    /**
     * Checks if this ray intersects a Triangle
     */
    intersectsTriangle(triangle: Triangle, backfaceCulling?: boolean): boolean;
    /**
     * Applies a Matrix4 transformation to this ray
     */
    applyMatrix4(matrix4: Matrix4): this;
    /**
     * Checks for strict equality with another Ray
     */
    equals(ray: Ray): boolean;
    /**
     * Sets this ray from an array [originX, originY, originZ, directionX, directionY, directionZ]
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [originX, originY, originZ, directionX, directionY, directionZ]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this ray from a JSON object
     */
    fromJSON(json: {
        origin: {
            x: number;
            y: number;
            z: number;
        };
        direction: {
            x: number;
            y: number;
            z: number;
        };
    }): this;
    /**
     * Returns a JSON representation of this ray
     */
    toJSON(): {
        origin: {
            x: number;
            y: number;
            z: number;
        };
        direction: {
            x: number;
            y: number;
            z: number;
        };
    };
    /**
     * Checks if a point lies on this ray (within epsilon tolerance)
     */
    containsPoint(point: Vector3, epsilon?: number): boolean;
    /**
     * Gets the parameter t for a point on the ray
     * Returns -1 if the point is not on the ray
     */
    getParameterAt(point: Vector3, epsilon?: number): number;
    /**
     * Returns a string representation of this ray
     */
    toString(): string;
}
/**
 * Extend Box3 with intersectRay method
 */
declare module './Box3' {
    interface Box3 {
        intersectRay(ray: Ray, target?: Vector3): Vector3 | null;
        intersectsRay(ray: Ray): boolean;
    }
}
/**
 * Extend Sphere with intersectRay method
 */
declare module './Sphere' {
    interface Sphere {
        intersectRay(ray: Ray, target?: Vector3): Vector3 | null;
        intersectsRay(ray: Ray): boolean;
    }
}
/**
 * Extend Triangle with intersectRay method
 */
declare module './Triangle' {
    interface Triangle {
        intersectRay(ray: Ray, backfaceCulling?: boolean, target?: Vector3): Vector3 | null;
        intersectsRay(ray: Ray, backfaceCulling?: boolean): boolean;
    }
}
