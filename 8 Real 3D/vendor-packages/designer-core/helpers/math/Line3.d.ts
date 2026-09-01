import type { Box3 } from './Box3';
import type { Matrix4 } from './Matrix4';
import type { Plane } from './Plane';
import { Ray } from './Ray';
import type { Sphere } from './Sphere';
import { Vector3 } from './Vector3';
/**
 * Custom Line3 class to replace Three.js Line3
 * Represents a line segment in 3D space defined by a start and end point
 */
export declare class Line3 {
    start: Vector3;
    end: Vector3;
    constructor(start?: Vector3, end?: Vector3);
    /**
     * Sets the start and end points of this line
     */
    set(start: Vector3, end: Vector3): this;
    /**
     * Sets the start and end points of this line from a Ray
     */
    setFromRay(ray: Ray): this;
    /**
     * Creates a Line3 from the camera's near plane to far plane through
     * a given NDC screen point. Works for both perspective and orthographic cameras.
     *
     * @param ndc                   - Normalized device coordinates in [-1, 1]
     * @param projectionMatrixInverse - camera.projectionMatrixInverse
     * @param cameraMatrixWorld       - camera.matrixWorld
     */
    setFromCamera(ndc: {
        x: number;
        y: number;
    }, projectionMatrixInverse: Matrix4, cameraMatrixWorld: Matrix4): this;
    /**
     * Returns a new Line3 with the same start and end points
     */
    clone(): Line3;
    /**
     * Copies the start and end points from another Line3
     */
    copy(line: Line3): this;
    /**
     * Gets the center point of this line segment
     */
    getCenter(target?: Vector3): Vector3;
    /**
     * Gets the delta vector (end - start)
     */
    delta(target?: Vector3): Vector3;
    /**
     * Gets the squared distance between start and end
     */
    distanceSq(): number;
    /**
     * Gets the distance between start and end (line segment length)
     */
    distance(): number;
    /**
     * Gets a point at a parameter t along the line (t=0 is start, t=1 is end)
     */
    at(t: number, target?: Vector3): Vector3;
    /**
     * Finds the parameter t for the closest point on the line to the given point
     * Returns value clamped between 0 and 1
     */
    closestPointToPointParameter(point: Vector3, clampToLine?: boolean): number;
    /**
     * Finds the closest point on the line segment to the given point
     */
    closestPointToPoint(point: Vector3, clampToLine?: boolean, target?: Vector3): Vector3;
    /**
     * Applies a Matrix4 transformation to this line
     */
    applyMatrix4(matrix: Matrix4): this;
    /**
     * Checks for strict equality with another Line3
     */
    equals(line: Line3): boolean;
    /**
     * Sets this line from an array [startX, startY, startZ, endX, endY, endZ]
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [startX, startY, startZ, endX, endY, endZ]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this line from a JSON object
     */
    fromJSON(json: {
        start: {
            x: number;
            y: number;
            z: number;
        };
        end: {
            x: number;
            y: number;
            z: number;
        };
    }): this;
    /**
     * Returns a JSON representation of this line
     */
    toJSON(): {
        start: {
            x: number;
            y: number;
            z: number;
        };
        end: {
            x: number;
            y: number;
            z: number;
        };
    };
    /**
     * Gets the squared distance from a point to this line segment
     */
    distanceToPointSq(point: Vector3): number;
    /**
     * Gets the distance from a point to this line segment
     */
    distanceToPoint(point: Vector3): number;
    /**
     * Returns the squared distance between this segment and the given one.
     * Also writes the closest point on this segment into c1, and the closest
     * point on the given segment into c2.
     *
     * Port of Three.js r183 Line3.distanceSqToLine3 — Ericson, "Real-Time
     * Collision Detection", chapter 5.1.9.
     */
    distanceSqToLine3(line: Line3, c1?: Vector3, c2?: Vector3): number;
    /**
     * Checks if a point lies on this line segment (within epsilon tolerance)
     */
    containsPoint(point: Vector3, epsilon?: number): boolean;
    /**
     * Gets the direction vector of this line (normalized)
     */
    getDirection(target?: Vector3): Vector3;
    /**
     * Checks if this line segment intersects a Box3
     */
    intersectsBox(box: Box3): boolean;
    /**
     * Checks if this line segment intersects a Sphere
     */
    intersectsSphere(sphere: Sphere): boolean;
    /**
     * Finds the intersection point of this line with a Plane
     * Returns null if the line is parallel to the plane or doesn't intersect
     */
    intersectPlane(plane: Plane, target?: Vector3): Vector3 | null;
    /**
     * Checks if this line intersects with a Plane
     */
    intersectsPlane(plane: Plane): boolean;
    /**
     * Reverses the direction of this line (swaps start and end)
     */
    reverse(): this;
    /**
     * Scales this line segment from its center
     */
    scale(scalar: number): this;
    /**
     * Translates this line by an offset vector
     */
    translate(offset: Vector3): this;
    /**
     * Gets the bounding box that contains this line segment
     */
    getBoundingBox(target: Box3): Box3;
    /**
     * Gets the bounding sphere that contains this line segment
     */
    getBoundingSphere(target: Sphere): Sphere;
    /**
     * Computes the minimum distance between this line segment and another
     */
    distanceToLine(line: Line3): number;
    /**
     * Finds the closest points on this line and another line segment
     * Returns parameters [t1, t2] where t1 is on this line and t2 is on the other line
     */
    closestPointsToLine(line: Line3): {
        thisPoint: Vector3;
        otherPoint: Vector3;
        thisT: number;
        otherT: number;
    };
    /**
     * Returns a string representation of this line
     */
    toString(): string;
}
/**
 * Extend Box3 with intersectsLine method
 */
declare module './Box3' {
    interface Box3 {
        intersectsLine(line: Line3): boolean;
    }
}
/**
 * Extend Sphere with intersectsLine method
 */
declare module './Sphere' {
    interface Sphere {
        intersectsLine(line: Line3): boolean;
    }
}
