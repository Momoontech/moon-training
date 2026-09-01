import { Vector2 } from './Vector2';
/**
 * Custom Box2 class to replace Three.js Box2
 * Represents an axis-aligned bounding box (AABB) in 2D space
 * Defined by min and max points
 */
export declare class Box2 {
    min: Vector2;
    max: Vector2;
    constructor(min?: Vector2, max?: Vector2);
    /**
     * Sets the min and max points of this box
     */
    set(min: Vector2, max: Vector2): this;
    /**
     * Sets this box from an array of points
     */
    setFromPoints(points: Vector2[]): this;
    /**
     * Sets this box from center and size
     */
    setFromCenterAndSize(center: Vector2, size: Vector2): this;
    /**
     * Returns a new Box2 with the same min and max
     */
    clone(): Box2;
    /**
     * Copies the min and max from another Box2
     */
    copy(box: Box2): this;
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
    getCenter(target?: Vector2): Vector2;
    /**
     * Gets the size (width, height) of this box
     */
    getSize(target?: Vector2): Vector2;
    /**
     * Expands this box to include the given point
     */
    expandByPoint(point: Vector2): this;
    /**
     * Expands this box by the given vector (adds to both min and max in opposite directions)
     */
    expandByVector(vector: Vector2): this;
    /**
     * Expands this box by a scalar (adds to both min and max in opposite directions)
     */
    expandByScalar(scalar: number): this;
    /**
     * Checks if this box contains the given point
     */
    containsPoint(point: Vector2): boolean;
    /**
     * Checks if this box contains the given box
     */
    containsBox(box: Box2): boolean;
    /**
     * Gets a parameter representing the position of a point within this box
     */
    getParameter(point: Vector2, target?: Vector2): Vector2;
    /**
     * Checks if this box intersects with another box
     */
    intersectsBox(box: Box2): boolean;
    /**
     * Clamps a point within this box
     */
    clampPoint(point: Vector2, target?: Vector2): Vector2;
    /**
     * Gets the distance from this box to a point
     * If the point is inside the box, returns 0
     */
    distanceToPoint(point: Vector2): number;
    /**
     * Sets this box to the intersection with another box
     */
    intersect(box: Box2): this;
    /**
     * Sets this box to the union with another box
     */
    union(box: Box2): this;
    /**
     * Translates this box by an offset
     */
    translate(offset: Vector2): this;
    /**
     * Checks for strict equality with another box
     */
    equals(box: Box2): boolean;
    /**
     * Sets this box from an array [minX, minY, maxX, maxY]
     */
    fromArray(array: number[], offset?: number): this;
    /**
     * Returns an array [minX, minY, maxX, maxY]
     */
    toArray(array?: number[], offset?: number): number[];
    /**
     * Sets this box from a JSON object
     */
    fromJSON(json: {
        min: {
            x: number;
            y: number;
        };
        max: {
            x: number;
            y: number;
        };
    }): this;
    /**
     * Returns a JSON representation of this box
     */
    toJSON(): {
        min: {
            x: number;
            y: number;
        };
        max: {
            x: number;
            y: number;
        };
    };
    /**
     * Gets all four corner points of this box
     */
    getCorners(target?: Vector2[]): Vector2[];
    /**
     * Gets the area of this box
     */
    getArea(): number;
    /**
     * Gets the perimeter of this box
     */
    getPerimeter(): number;
    /**
     * Checks if a point is on the boundary of this box
     */
    isPointOnBoundary(point: Vector2, epsilon?: number): boolean;
    /**
     * Scales this box around its center
     */
    scale(scalar: number): this;
    /**
     * Returns a string representation of this box
     */
    toString(): string;
}
