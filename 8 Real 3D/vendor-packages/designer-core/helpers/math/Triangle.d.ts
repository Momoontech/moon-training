import type { Box3 } from './Box3';
import type { Line3 } from './Line3';
import type { Plane } from './Plane';
import './Ray';
import { Vector3 } from './Vector3';
/**
 * Custom Triangle class to replace Three.js Triangle
 * Represents a triangle in 3D space defined by three vertices
 */
export declare class Triangle {
    a: Vector3;
    b: Vector3;
    c: Vector3;
    constructor(a?: Vector3, b?: Vector3, c?: Vector3);
    /**
     * Sets the three vertices of this triangle
     */
    set(a: Vector3, b: Vector3, c: Vector3): this;
    /**
     * Sets the triangle from an array of points and indices
     */
    setFromPointsAndIndices(points: Vector3[], i0: number, i1: number, i2: number): this;
    /**
     * Returns a new Triangle with the same vertices
     */
    clone(): Triangle;
    /**
     * Copies the vertices from another Triangle
     */
    copy(triangle: Triangle): this;
    /**
     * Gets the area of this triangle
     */
    getArea(): number;
    /**
     * Gets the midpoint/centroid of this triangle
     */
    getMidpoint(target?: Vector3): Vector3;
    /**
     * Gets the normal vector of this triangle (not normalized)
     */
    getNormal(target?: Vector3): Vector3;
    /**
     * Static method to get the normal of a triangle defined by three points
     */
    static getNormal(a: Vector3, b: Vector3, c: Vector3, target?: Vector3): Vector3;
    /**
     * Gets the plane that contains this triangle
     */
    getPlane(target: Plane): Plane;
    /**
     * Gets barycentric coordinates of a point relative to this triangle
     */
    getBarycoord(point: Vector3, target?: Vector3): Vector3;
    /**
     * Static method to get barycentric coordinates
     */
    static getBarycoord(point: Vector3, a: Vector3, b: Vector3, c: Vector3, target?: Vector3): Vector3;
    /**
     * Gets a UV coordinate at the given point using barycentric coordinates
     */
    static getUV(point: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, uv1: {
        x: number;
        y: number;
    }, uv2: {
        x: number;
        y: number;
    }, uv3: {
        x: number;
        y: number;
    }, target: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    };
    /**
     * Checks if a point is inside this triangle
     */
    containsPoint(point: Vector3): boolean;
    /**
     * Static method to check if a point is inside a triangle
     */
    static containsPoint(point: Vector3, a: Vector3, b: Vector3, c: Vector3): boolean;
    /**
     * Finds the closest point on this triangle to a given point
     */
    closestPointToPoint(point: Vector3, target?: Vector3): Vector3;
    /**
     * Gets the distance from a point to this triangle
     */
    distanceToPoint(point: Vector3): number;
    /**
     * Checks for strict equality with another Triangle
     */
    equals(triangle: Triangle): boolean;
    /**
     * Sets this triangle from an array [ax, ay, az, bx, by, bz, cx, cy, cz]
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [ax, ay, az, bx, by, bz, cx, cy, cz]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this triangle from a JSON object
     */
    fromJSON(json: {
        a: {
            x: number;
            y: number;
            z: number;
        };
        b: {
            x: number;
            y: number;
            z: number;
        };
        c: {
            x: number;
            y: number;
            z: number;
        };
    }): this;
    /**
     * Returns a JSON representation of this triangle
     */
    toJSON(): {
        a: {
            x: number;
            y: number;
            z: number;
        };
        b: {
            x: number;
            y: number;
            z: number;
        };
        c: {
            x: number;
            y: number;
            z: number;
        };
    };
    /**
     * Gets the bounding box that contains this triangle
     */
    getBoundingBox(target: Box3): Box3;
    /**
     * Gets the perimeter of this triangle
     */
    getPerimeter(): number;
    /**
     * Checks if this triangle is degenerate (collinear points)
     */
    isDegenerate(epsilon?: number): boolean;
    /**
     * Gets the three edges of this triangle as Line3 segments
     */
    getEdges(): [Line3, Line3, Line3];
    /**
     * Checks if a point is on the boundary of this triangle (within epsilon)
     */
    isPointOnBoundary(point: Vector3, epsilon?: number): boolean;
    /**
     * Interpolates a point using barycentric coordinates
     */
    static interpolate(p1: Vector3, p2: Vector3, p3: Vector3, u: number, v: number, w: number, target?: Vector3): Vector3;
    /**
     * Checks if this triangle intersects with a Box3
     */
    intersectsBox(box: Box3): boolean;
    /**
     * Intersects this triangle with a Line3
     * Returns the intersection point or null if no intersection
     */
    intersectLine3(line: Line3, target?: Vector3): Vector3 | null;
    /**
     * Checks if this triangle intersects with a Line3
     */
    intersectsLine3(line: Line3): boolean;
    /**
     * Returns a string representation of this triangle
     */
    toString(): string;
}
/**
 * Extend Box3 with intersectsTriangle method
 */
declare module './Box3' {
    interface Box3 {
        intersectsTriangle(triangle: Triangle): boolean;
    }
}
