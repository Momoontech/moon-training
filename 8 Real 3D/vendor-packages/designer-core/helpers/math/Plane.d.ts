import type { Box3 } from './Box3';
import type { Line3 } from './Line3';
import { Matrix4 } from './Matrix4';
import type { Sphere } from './Sphere';
import { Vector3 } from './Vector3';
/**
 * Custom Plane class to replace Three.js Plane
 * Represents a plane in 3D space defined by a normal vector and a constant
 * The plane equation is: normal · point + constant = 0
 */
export declare class Plane {
    normal: Vector3;
    constant: number;
    constructor(normal?: Vector3, constant?: number);
    /**
     * Sets the normal and constant of this plane
     */
    set(normal: Vector3, constant: number): this;
    /**
     * Sets the plane from individual components
     */
    setComponents(x: number, y: number, z: number, w: number): this;
    /**
     * Sets the plane from a normal and a coplanar point
     */
    setFromNormalAndCoplanarPoint(normal: Vector3, point: Vector3): this;
    /**
     * Sets the plane from three coplanar points
     */
    setFromCoplanarPoints(a: Vector3, b: Vector3, c: Vector3): this;
    /**
     * Returns a new Plane with the same normal and constant
     */
    clone(): Plane;
    /**
     * Copies the normal and constant from another Plane
     */
    copy(plane: Plane): this;
    /**
     * Normalizes the normal vector and adjusts the constant accordingly
     */
    normalize(): this;
    /**
     * Negates both the normal and constant
     */
    negate(): this;
    /**
     * Computes the signed distance from a point to this plane
     * Positive if the point is on the side the normal points to, negative otherwise
     */
    distanceToPoint(point: Vector3): number;
    /**
     * Projects a point onto this plane
     */
    projectPoint(point: Vector3, target?: Vector3): Vector3;
    /**
     * Intersects this plane with a line defined by a start and end point
     * Returns the intersection point if it exists, or null if parallel
     */
    intersectLine(lineStart: Vector3, lineEnd: Vector3, target?: Vector3): Vector3 | null;
    /**
     * Checks if a line intersects this plane
     */
    intersectsLine(lineStart: Vector3, lineEnd: Vector3): boolean;
    /**
     * Checks if this plane intersects a Box3
     */
    intersectsBox(box: Box3): boolean;
    /**
     * Returns a coplanar point on this plane (a point on the plane closest to the origin)
     */
    coplanarPoint(target?: Vector3): Vector3;
    /**
     * Applies a Matrix4 transformation to this plane
     */
    applyMatrix4(matrix: Matrix4, optionalNormalMatrix?: Matrix4): this;
    /**
     * Translates this plane by an offset
     */
    translate(offset: Vector3): this;
    /**
     * Checks for strict equality with another plane
     */
    equals(plane: Plane): boolean;
    /**
     * Sets this plane from an array [normalX, normalY, normalZ, constant]
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [normalX, normalY, normalZ, constant]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this plane from a JSON object
     */
    fromJSON(json: {
        normal: {
            x: number;
            y: number;
            z: number;
        };
        constant: number;
    }): this;
    /**
     * Returns a JSON representation of this plane
     */
    toJSON(): {
        normal: {
            x: number;
            y: number;
            z: number;
        };
        constant: number;
    };
    /**
     * Gets the angle between this plane and another plane (in radians)
     */
    angleTo(plane: Plane): number;
    /**
     * Checks if a point is on this plane (within epsilon tolerance)
     */
    isPointOnPlane(point: Vector3, epsilon?: number): boolean;
    /**
     * Returns a string representation of this plane
     */
    toString(): string;
    /**
     * Computes the signed distance from a sphere to this plane
     */
    distanceToSphere(sphere: Sphere): number;
    /**
     * Checks if this plane intersects a sphere
     */
    intersectsSphere(sphere: Sphere): boolean;
    /**
     * Intersects this plane with a Line3
     */
    intersectLine3(line: Line3, target?: Vector3): Vector3 | null;
    /**
     * Checks if a Line3 intersects this plane
     */
    intersectsLine3(line: Line3): boolean;
    /**
     * Returns the closest point on this plane to a Line3
     */
    closestPointToLine3(line: Line3, target?: Vector3): Vector3;
    /**
     * Gets the angle between this plane and a Line3 (in radians)
     */
    angleToLine3(line: Line3): number;
}
