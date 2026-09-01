import { Matrix4 } from './Matrix4.js';
import { Vector3 } from './Vector3.js';

/**
 * Custom Plane class to replace Three.js Plane
 * Represents a plane in 3D space defined by a normal vector and a constant
 * The plane equation is: normal · point + constant = 0
 */
class Plane {
    normal;
    constant;
    constructor(normal, constant = 0) {
        this.normal = normal !== undefined ? normal : new Vector3(1, 0, 0);
        this.constant = constant;
    }
    /**
     * Sets the normal and constant of this plane
     */
    set(normal, constant) {
        this.normal.copy(normal);
        this.constant = constant;
        return this;
    }
    /**
     * Sets the plane from individual components
     */
    setComponents(x, y, z, w) {
        this.normal.set(x, y, z);
        this.constant = w;
        return this;
    }
    /**
     * Sets the plane from a normal and a coplanar point
     */
    setFromNormalAndCoplanarPoint(normal, point) {
        this.normal.copy(normal);
        this.constant = -point.dot(this.normal);
        return this;
    }
    /**
     * Sets the plane from three coplanar points
     */
    setFromCoplanarPoints(a, b, c) {
        const v1 = new Vector3();
        const v2 = new Vector3();
        const normal = v1.subVectors(c, b).cross(v2.subVectors(a, b)).normalize();
        // Q: should an error be thrown if normal is zero (e.g. degenerate plane)?
        this.setFromNormalAndCoplanarPoint(normal, a);
        return this;
    }
    /**
     * Returns a new Plane with the same normal and constant
     */
    clone() {
        return new Plane().copy(this);
    }
    /**
     * Copies the normal and constant from another Plane
     */
    copy(plane) {
        this.normal.copy(plane.normal);
        this.constant = plane.constant;
        return this;
    }
    /**
     * Normalizes the normal vector and adjusts the constant accordingly
     */
    normalize() {
        // Note: will lead to a divide by zero if the plane is invalid.
        const inverseNormalLength = 1.0 / this.normal.length();
        this.normal.multiplyScalar(inverseNormalLength);
        this.constant *= inverseNormalLength;
        return this;
    }
    /**
     * Negates both the normal and constant
     */
    negate() {
        this.constant *= -1;
        this.normal.negate();
        return this;
    }
    /**
     * Computes the signed distance from a point to this plane
     * Positive if the point is on the side the normal points to, negative otherwise
     */
    distanceToPoint(point) {
        return this.normal.dot(point) + this.constant;
    }
    /**
     * Projects a point onto this plane
     */
    projectPoint(point, target = new Vector3()) {
        return target.copy(point).addScaledVector(this.normal, -this.distanceToPoint(point));
    }
    /**
     * Intersects this plane with a line defined by a start and end point
     * Returns the intersection point if it exists, or null if parallel
     */
    intersectLine(lineStart, lineEnd, target = new Vector3()) {
        const direction = new Vector3();
        direction.subVectors(lineEnd, lineStart);
        const denominator = this.normal.dot(direction);
        if (denominator === 0) {
            // line is coplanar, return origin
            if (this.distanceToPoint(lineStart) === 0) {
                return target.copy(lineStart);
            }
            // Unsure if this is the correct method to handle this case.
            return null;
        }
        const t = -(lineStart.dot(this.normal) + this.constant) / denominator;
        if (t < 0 || t > 1) {
            return null;
        }
        return target.copy(lineStart).addScaledVector(direction, t);
    }
    /**
     * Checks if a line intersects this plane
     */
    intersectsLine(lineStart, lineEnd) {
        // Note: this tests if a line intersects the plane, not whether it crosses it.
        const startSign = this.distanceToPoint(lineStart);
        const endSign = this.distanceToPoint(lineEnd);
        return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
    }
    /**
     * Checks if this plane intersects a Box3
     */
    intersectsBox(box) {
        return box.intersectsPlane(this);
    }
    /**
     * Returns a coplanar point on this plane (a point on the plane closest to the origin)
     */
    coplanarPoint(target = new Vector3()) {
        return target.copy(this.normal).multiplyScalar(-this.constant);
    }
    /**
     * Applies a Matrix4 transformation to this plane
     */
    applyMatrix4(matrix, optionalNormalMatrix) {
        const normalMatrix = optionalNormalMatrix || new Matrix4().copy(matrix).invert().transpose();
        const referencePoint = this.coplanarPoint(new Vector3()).applyMatrix4(matrix);
        const normal = this.normal.applyMatrix4(normalMatrix).normalize();
        this.constant = -referencePoint.dot(normal);
        return this;
    }
    /**
     * Translates this plane by an offset
     */
    translate(offset) {
        this.constant -= offset.dot(this.normal);
        return this;
    }
    /**
     * Checks for strict equality with another plane
     */
    equals(plane) {
        return plane.normal.equals(this.normal) && plane.constant === this.constant;
    }
    /**
     * Sets this plane from an array [normalX, normalY, normalZ, constant]
     */
    fromArray(array, offset = 0) {
        this.normal.fromArray(array, offset);
        this.constant = array[offset + 3];
        return this;
    }
    /**
     * Returns an array [normalX, normalY, normalZ, constant]
     */
    toArray(array = [], offset = 0) {
        this.normal.toArray(array, offset);
        array[offset + 3] = this.constant;
        return array;
    }
    /**
     * Sets this plane from a JSON object
     */
    fromJSON(json) {
        this.normal.set(json.normal.x, json.normal.y, json.normal.z);
        this.constant = json.constant;
        return this;
    }
    /**
     * Returns a JSON representation of this plane
     */
    toJSON() {
        return {
            normal: { x: this.normal.x, y: this.normal.y, z: this.normal.z },
            constant: this.constant
        };
    }
    /**
     * Gets the angle between this plane and another plane (in radians)
     */
    angleTo(plane) {
        return this.normal.angleTo(plane.normal);
    }
    /**
     * Checks if a point is on this plane (within epsilon tolerance)
     */
    isPointOnPlane(point, epsilon = 0.0001) {
        return Math.abs(this.distanceToPoint(point)) < epsilon;
    }
    /**
     * Returns a string representation of this plane
     */
    toString() {
        return `Plane(normal: (${this.normal.x}, ${this.normal.y}, ${this.normal.z}), constant: ${this.constant})`;
    }
    /**
     * Computes the signed distance from a sphere to this plane
     */
    distanceToSphere(sphere) {
        return this.distanceToPoint(sphere.center) - sphere.radius;
    }
    /**
     * Checks if this plane intersects a sphere
     */
    intersectsSphere(sphere) {
        return Math.abs(this.distanceToPoint(sphere.center)) <= sphere.radius;
    }
    /**
     * Intersects this plane with a Line3
     */
    intersectLine3(line, target = new Vector3()) {
        const direction = line.delta(new Vector3());
        const denominator = this.normal.dot(direction);
        if (denominator === 0) {
            // line is coplanar, return origin
            if (this.distanceToPoint(line.start) === 0) {
                return target.copy(line.start);
            }
            // Unsure if this is the correct method to handle this case.
            return null;
        }
        const t = -(line.start.dot(this.normal) + this.constant) / denominator;
        if (t < 0 || t > 1) {
            return null;
        }
        return target.copy(line.start).addScaledVector(direction, t);
    }
    /**
     * Checks if a Line3 intersects this plane
     */
    intersectsLine3(line) {
        const startSign = this.distanceToPoint(line.start);
        const endSign = this.distanceToPoint(line.end);
        return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);
    }
    /**
     * Returns the closest point on this plane to a Line3
     */
    closestPointToLine3(line, target = new Vector3()) {
        const point = this.intersectLine3(line, target);
        if (point !== null) {
            return point;
        }
        // If no intersection, return the closest endpoint
        const distToStart = Math.abs(this.distanceToPoint(line.start));
        const distToEnd = Math.abs(this.distanceToPoint(line.end));
        return distToStart < distToEnd ? target.copy(line.start) : target.copy(line.end);
    }
    /**
     * Gets the angle between this plane and a Line3 (in radians)
     */
    angleToLine3(line) {
        const direction = line.delta(new Vector3()).normalize();
        // The angle between a plane and a line is the complement of the angle between
        // the plane normal and the line direction
        const angle = Math.asin(Math.abs(this.normal.dot(direction)));
        return angle;
    }
}

export { Plane };
