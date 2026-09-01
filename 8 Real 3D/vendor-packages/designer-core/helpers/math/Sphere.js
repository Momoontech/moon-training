import { Box3 } from './Box3.js';
import { Vector3 } from './Vector3.js';

/**
 * Custom Sphere class to replace Three.js Sphere
 * Represents a sphere in 3D space defined by a center point and radius
 */
class Sphere {
    center;
    radius;
    constructor(center, radius = -1) {
        this.center = center !== undefined ? center : new Vector3();
        this.radius = radius;
    }
    /**
     * Sets the center and radius of this sphere
     */
    set(center, radius) {
        this.center.copy(center);
        this.radius = radius;
        return this;
    }
    /**
     * Sets this sphere from an array of points
     */
    setFromPoints(points, optionalCenter) {
        const center = this.center;
        if (optionalCenter !== undefined) {
            center.copy(optionalCenter);
        }
        else {
            // Compute the center as the average of all points
            center.set(0, 0, 0);
            for (let i = 0, il = points.length; i < il; i++) {
                center.add(points[i]);
            }
            center.divideScalar(points.length);
        }
        let maxRadiusSq = 0;
        for (let i = 0, il = points.length; i < il; i++) {
            maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(points[i]));
        }
        this.radius = Math.sqrt(maxRadiusSq);
        return this;
    }
    /**
     * Returns a new Sphere with the same center and radius
     */
    clone() {
        return new Sphere().copy(this);
    }
    /**
     * Copies the center and radius from another Sphere
     */
    copy(sphere) {
        this.center.copy(sphere.center);
        this.radius = sphere.radius;
        return this;
    }
    /**
     * Makes this sphere empty (negative radius)
     */
    makeEmpty() {
        this.center.set(0, 0, 0);
        this.radius = -1;
        return this;
    }
    /**
     * Checks if this sphere is empty (negative radius)
     */
    isEmpty() {
        return this.radius < 0;
    }
    /**
     * Computes a bounding box for this sphere
     */
    getBoundingBox(target = new Box3()) {
        if (this.isEmpty()) {
            target.makeEmpty();
            return target;
        }
        target.set(this.center, this.center);
        target.expandByScalar(this.radius);
        return target;
    }
    /**
     * Checks if this sphere contains the given point
     */
    containsPoint(point) {
        return point.distanceToSquared(this.center) <= this.radius * this.radius;
    }
    /**
     * Computes the distance from this sphere's surface to a point
     * Returns negative if the point is inside the sphere
     */
    distanceToPoint(point) {
        return point.distanceTo(this.center) - this.radius;
    }
    /**
     * Checks if this sphere intersects with another sphere
     */
    intersectsSphere(sphere) {
        const radiusSum = this.radius + sphere.radius;
        return sphere.center.distanceToSquared(this.center) <= radiusSum * radiusSum;
    }
    /**
     * Checks if this sphere intersects with a Box3
     */
    intersectsBox(box) {
        return box.intersectsSphere(this);
    }
    /**
     * Checks if this sphere intersects with a Plane
     */
    intersectsPlane(plane) {
        return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
    }
    /**
     * Checks if this sphere intersects with a line segment
     */
    intersectsLine(line) {
        // Find the closest point on the line to the sphere center
        const closestPoint = line.closestPointToPoint(this.center, true, new Vector3());
        // Check if that point is within the sphere
        return this.containsPoint(closestPoint);
    }
    /**
     * Clamps a point to the surface of this sphere
     */
    clampPoint(point, target = new Vector3()) {
        const deltaLengthSq = this.center.distanceToSquared(point);
        target.copy(point);
        if (deltaLengthSq > this.radius * this.radius) {
            target.sub(this.center).normalize();
            target.multiplyScalar(this.radius).add(this.center);
        }
        return target;
    }
    /**
     * Expands this sphere to include the given point
     */
    expandByPoint(point) {
        if (this.isEmpty()) {
            this.center.copy(point);
            this.radius = 0;
            return this;
        }
        const lengthSq = this.center.distanceToSquared(point);
        if (lengthSq > this.radius * this.radius) {
            const length = Math.sqrt(lengthSq);
            const delta = (length - this.radius) * 0.5;
            this.center.addScaledVector(new Vector3().subVectors(point, this.center), delta / length);
            this.radius += delta;
        }
        return this;
    }
    /**
     * Sets this sphere to the union with another sphere
     */
    union(sphere) {
        if (sphere.isEmpty()) {
            return this;
        }
        if (this.isEmpty()) {
            this.copy(sphere);
            return this;
        }
        // Vector from this center to sphere center
        const toCenter = new Vector3().subVectors(sphere.center, this.center);
        const distance = toCenter.length();
        if (distance === 0) {
            // Concentric spheres
            this.radius = Math.max(this.radius, sphere.radius);
            return this;
        }
        // Check if one sphere contains the other
        if (distance + sphere.radius <= this.radius) {
            // sphere is inside this
            return this;
        }
        if (distance + this.radius <= sphere.radius) {
            // this is inside sphere
            this.copy(sphere);
            return this;
        }
        // Create a sphere that encompasses both
        const newRadius = (this.radius + sphere.radius + distance) * 0.5;
        toCenter.normalize();
        this.center.copy(this.center).addScaledVector(toCenter, newRadius - this.radius);
        this.radius = newRadius;
        return this;
    }
    /**
     * Applies a Matrix4 transformation to this sphere
     */
    applyMatrix4(matrix) {
        this.center.applyMatrix4(matrix);
        this.radius = this.radius * matrix.getMaxScaleOnAxis();
        return this;
    }
    /**
     * Translates this sphere by an offset
     */
    translate(offset) {
        this.center.add(offset);
        return this;
    }
    /**
     * Expands this sphere by a delta value
     */
    expandByScalar(scalar) {
        this.radius += scalar;
        return this;
    }
    /**
     * Checks for strict equality with another sphere
     */
    equals(sphere) {
        return sphere.center.equals(this.center) && sphere.radius === this.radius;
    }
    /**
     * Sets this sphere from an array [centerX, centerY, centerZ, radius]
     */
    fromArray(array, offset = 0) {
        this.center.fromArray(array, offset);
        this.radius = array[offset + 3];
        return this;
    }
    /**
     * Returns an array [centerX, centerY, centerZ, radius]
     */
    toArray(array = [], offset = 0) {
        this.center.toArray(array, offset);
        array[offset + 3] = this.radius;
        return array;
    }
    /**
     * Sets this sphere from a JSON object
     */
    fromJSON(json) {
        this.center.set(json.center.x, json.center.y, json.center.z);
        this.radius = json.radius;
        return this;
    }
    /**
     * Returns a JSON representation of this sphere
     */
    toJSON() {
        return {
            center: { x: this.center.x, y: this.center.y, z: this.center.z },
            radius: this.radius
        };
    }
    /**
     * Gets the volume of this sphere
     */
    getVolume() {
        return (4 / 3) * Math.PI * Math.pow(this.radius, 3);
    }
    /**
     * Gets the surface area of this sphere
     */
    getSurfaceArea() {
        return 4 * Math.PI * this.radius * this.radius;
    }
    /**
     * Checks if a point is on the surface of this sphere (within epsilon tolerance)
     */
    isPointOnSurface(point, epsilon = 0.0001) {
        return Math.abs(this.distanceToPoint(point)) < epsilon;
    }
    /**
     * Gets a point on the surface of the sphere at given spherical coordinates
     * @param theta - Azimuthal angle (0 to 2π)
     * @param phi - Polar angle (0 to π)
     */
    getPointAt(theta, phi, target = new Vector3()) {
        const sinPhiRadius = Math.sin(phi) * this.radius;
        target.x = this.center.x + sinPhiRadius * Math.sin(theta);
        target.y = this.center.y + Math.cos(phi) * this.radius;
        target.z = this.center.z + sinPhiRadius * Math.cos(theta);
        return target;
    }
    /**
     * Returns a string representation of this sphere
     */
    toString() {
        return `Sphere(center: (${this.center.x}, ${this.center.y}, ${this.center.z}), radius: ${this.radius})`;
    }
    // ===== METHODS REQUIRING ADDITIONAL THREE.JS CLASSES (COMMENTED OUT) =====
    /**
     * Sets this sphere from a BufferAttribute
     * Requires: BufferAttribute class
     */
    // setFromBufferAttribute(attribute: BufferAttribute): this {
    //   const points: Vector3[] = [];
    //   for (let i = 0, l = attribute.count; i < l; i++) {
    //     const point = new Vector3();
    //     point.fromBufferAttribute(attribute, i);
    //     points.push(point);
    //   }
    //   return this.setFromPoints(points);
    // }
    /**
     * Intersects this sphere with a Ray
     */
    intersectRay(ray, target = new Vector3()) {
        return ray.intersectSphere(this, target);
    }
    /**
     * Checks if this sphere intersects with a Ray
     */
    intersectsRay(ray) {
        return ray.intersectsSphere(this);
    }
    /**
     * Computes the distance from this sphere to a Ray
     */
    distanceToRay(ray) {
        const point = ray.closestPointToPoint(this.center, new Vector3());
        return this.distanceToPoint(point);
    }
    /**
     * Intersects this sphere with a Line3
     * Requires: Line3 class
     */
    // intersectLine3(line: Line3, target: Vector3 = new Vector3()): Vector3 | null {
    //   const v1 = new Vector3();
    //   const direction = line.delta(v1);
    //   const lineLength = direction.length();
    //   direction.normalize();
    //   // Create a ray from the line
    //   const ray = new Ray(line.start, direction);
    //   const intersect = this.intersectRay(ray, target);
    //   if (intersect === null) return null;
    //   // Check if the intersection is within the line segment
    //   const distance = target.distanceTo(line.start);
    //   if (distance > lineLength) return null;
    //   return target;
    // }
    /**
     * Checks if this sphere intersects with a Triangle
     * Requires: Triangle class
     */
    // intersectsTriangle(triangle: Triangle): boolean {
    //   // Find the closest point on the triangle to the sphere center
    //   const closestPoint = triangle.closestPointToPoint(this.center, new Vector3());
    //   return this.containsPoint(closestPoint);
    // }
    /**
     * Sets this sphere from an Object3D's bounding sphere
     * Requires: Object3D class
     */
    // setFromObject(object: Object3D): this {
    //   const box = new Box3();
    //   box.setFromObject(object, true);
    //   return this.setFromBox3(box);
    // }
    /**
     * Sets this sphere from a Box3
     * Note: This creates a bounding sphere, not the minimal sphere
     */
    setFromBox3(box) {
        box.getCenter(this.center);
        this.radius = box.getSize(new Vector3()).length() * 0.5;
        return this;
    }
}

export { Sphere };
