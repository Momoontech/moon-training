import { Vector2 } from './Vector2.js';

/**
 * Custom Box2 class to replace Three.js Box2
 * Represents an axis-aligned bounding box (AABB) in 2D space
 * Defined by min and max points
 */
class Box2 {
    min;
    max;
    constructor(min, max) {
        this.min = min !== undefined ? min : new Vector2(+Infinity, +Infinity);
        this.max = max !== undefined ? max : new Vector2(-Infinity, -Infinity);
    }
    /**
     * Sets the min and max points of this box
     */
    set(min, max) {
        this.min.copy(min);
        this.max.copy(max);
        return this;
    }
    /**
     * Sets this box from an array of points
     */
    setFromPoints(points) {
        this.makeEmpty();
        for (let i = 0, il = points.length; i < il; i++) {
            this.expandByPoint(points[i]);
        }
        return this;
    }
    /**
     * Sets this box from center and size
     */
    setFromCenterAndSize(center, size) {
        const halfSize = new Vector2().copy(size).multiplyScalar(0.5);
        this.min.copy(center).sub(halfSize);
        this.max.copy(center).add(halfSize);
        return this;
    }
    /**
     * Returns a new Box2 with the same min and max
     */
    clone() {
        return new Box2().copy(this);
    }
    /**
     * Copies the min and max from another Box2
     */
    copy(box) {
        this.min.copy(box.min);
        this.max.copy(box.max);
        return this;
    }
    /**
     * Makes this box empty (inverted bounds)
     */
    makeEmpty() {
        this.min.x = this.min.y = +Infinity;
        this.max.x = this.max.y = -Infinity;
        return this;
    }
    /**
     * Checks if this box is empty
     */
    isEmpty() {
        // This is a more robust check for empty boxes than just comparing min/max
        return this.max.x < this.min.x || this.max.y < this.min.y;
    }
    /**
     * Gets the center point of this box
     */
    getCenter(target = new Vector2()) {
        return this.isEmpty() ? target.set(0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
    }
    /**
     * Gets the size (width, height) of this box
     */
    getSize(target = new Vector2()) {
        return this.isEmpty() ? target.set(0, 0) : target.subVectors(this.max, this.min);
    }
    /**
     * Expands this box to include the given point
     */
    expandByPoint(point) {
        this.min.min(point);
        this.max.max(point);
        return this;
    }
    /**
     * Expands this box by the given vector (adds to both min and max in opposite directions)
     */
    expandByVector(vector) {
        this.min.sub(vector);
        this.max.add(vector);
        return this;
    }
    /**
     * Expands this box by a scalar (adds to both min and max in opposite directions)
     */
    expandByScalar(scalar) {
        this.min.addScalar(-scalar);
        this.max.addScalar(scalar);
        return this;
    }
    /**
     * Checks if this box contains the given point
     */
    containsPoint(point) {
        return point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y ? false : true;
    }
    /**
     * Checks if this box contains the given box
     */
    containsBox(box) {
        return this.min.x <= box.min.x && box.max.x <= this.max.x && this.min.y <= box.min.y && box.max.y <= this.max.y;
    }
    /**
     * Gets a parameter representing the position of a point within this box
     */
    getParameter(point, target = new Vector2()) {
        // This can be used to get the normalized position within the box [0,1]
        return target.set((point.x - this.min.x) / (this.max.x - this.min.x), (point.y - this.min.y) / (this.max.y - this.min.y));
    }
    /**
     * Checks if this box intersects with another box
     */
    intersectsBox(box) {
        // Using 6 splitting planes to rule out intersections
        return box.max.x < this.min.x || box.min.x > this.max.x || box.max.y < this.min.y || box.min.y > this.max.y
            ? false
            : true;
    }
    /**
     * Clamps a point within this box
     */
    clampPoint(point, target = new Vector2()) {
        return target.copy(point).clamp(this.min, this.max);
    }
    /**
     * Gets the distance from this box to a point
     * If the point is inside the box, returns 0
     */
    distanceToPoint(point) {
        const clampedPoint = new Vector2().copy(point).clamp(this.min, this.max);
        return clampedPoint.sub(point).length();
    }
    /**
     * Sets this box to the intersection with another box
     */
    intersect(box) {
        this.min.max(box.min);
        this.max.min(box.max);
        // Ensure empty box if there's no intersection
        if (this.isEmpty())
            this.makeEmpty();
        return this;
    }
    /**
     * Sets this box to the union with another box
     */
    union(box) {
        this.min.min(box.min);
        this.max.max(box.max);
        return this;
    }
    /**
     * Translates this box by an offset
     */
    translate(offset) {
        this.min.add(offset);
        this.max.add(offset);
        return this;
    }
    /**
     * Checks for strict equality with another box
     */
    equals(box) {
        return box.min.equals(this.min) && box.max.equals(this.max);
    }
    /**
     * Sets this box from an array [minX, minY, maxX, maxY]
     */
    fromArray(array, offset = 0) {
        this.min.fromArray(array, offset);
        this.max.fromArray(array, offset + 2);
        return this;
    }
    /**
     * Returns an array [minX, minY, maxX, maxY]
     */
    toArray(array = [], offset = 0) {
        this.min.toArray(array, offset);
        this.max.toArray(array, offset + 2);
        return array;
    }
    /**
     * Sets this box from a JSON object
     */
    fromJSON(json) {
        this.min.set(json.min.x, json.min.y);
        this.max.set(json.max.x, json.max.y);
        return this;
    }
    /**
     * Returns a JSON representation of this box
     */
    toJSON() {
        return {
            min: { x: this.min.x, y: this.min.y },
            max: { x: this.max.x, y: this.max.y }
        };
    }
    /**
     * Gets all four corner points of this box
     */
    getCorners(target = []) {
        target[0] = new Vector2(this.min.x, this.min.y);
        target[1] = new Vector2(this.max.x, this.min.y);
        target[2] = new Vector2(this.max.x, this.max.y);
        target[3] = new Vector2(this.min.x, this.max.y);
        return target;
    }
    /**
     * Gets the area of this box
     */
    getArea() {
        if (this.isEmpty())
            return 0;
        const size = this.getSize();
        return size.x * size.y;
    }
    /**
     * Gets the perimeter of this box
     */
    getPerimeter() {
        if (this.isEmpty())
            return 0;
        const size = this.getSize();
        return 2 * (size.x + size.y);
    }
    /**
     * Checks if a point is on the boundary of this box
     */
    isPointOnBoundary(point, epsilon = 0.0001) {
        if (!this.containsPoint(point))
            return false;
        const isOnLeft = Math.abs(point.x - this.min.x) < epsilon;
        const isOnRight = Math.abs(point.x - this.max.x) < epsilon;
        const isOnBottom = Math.abs(point.y - this.min.y) < epsilon;
        const isOnTop = Math.abs(point.y - this.max.y) < epsilon;
        return isOnLeft || isOnRight || isOnBottom || isOnTop;
    }
    /**
     * Scales this box around its center
     */
    scale(scalar) {
        const center = this.getCenter();
        const size = this.getSize().multiplyScalar(scalar);
        return this.setFromCenterAndSize(center, size);
    }
    /**
     * Returns a string representation of this box
     */
    toString() {
        return `Box2(min: (${this.min.x}, ${this.min.y}), max: (${this.max.x}, ${this.max.y}))`;
    }
}

export { Box2 };
