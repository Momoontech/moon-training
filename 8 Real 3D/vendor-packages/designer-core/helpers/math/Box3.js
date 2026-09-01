import { Vector3 } from './Vector3.js';

/**
 * Custom Box3 class to replace Three.js Box3
 * Represents an axis-aligned bounding box (AABB) in 3D space
 * Defined by min and max points
 */
class Box3 {
    min;
    max;
    constructor(min, max) {
        this.min = min !== undefined ? min : new Vector3(+Infinity, +Infinity, +Infinity);
        this.max = max !== undefined ? max : new Vector3(-Infinity, -Infinity, -Infinity);
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
        const halfSize = new Vector3().copy(size).multiplyScalar(0.5);
        this.min.copy(center).sub(halfSize);
        this.max.copy(center).add(halfSize);
        return this;
    }
    /**
     * Returns a new Box3 with the same min and max
     */
    clone() {
        return new Box3().copy(this);
    }
    /**
     * Copies the min and max from another Box3
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
        this.min.x = this.min.y = this.min.z = +Infinity;
        this.max.x = this.max.y = this.max.z = -Infinity;
        return this;
    }
    /**
     * Checks if this box is empty
     */
    isEmpty() {
        // This is a more robust check for empty boxes than just comparing min/max
        return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
    }
    /**
     * Gets the center point of this box
     */
    getCenter(target = new Vector3()) {
        return this.isEmpty() ? target.set(0, 0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
    }
    /**
     * Gets the size (width, height, depth) of this box
     */
    getSize(target = new Vector3()) {
        return this.isEmpty() ? target.set(0, 0, 0) : target.subVectors(this.max, this.min);
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
        return point.x < this.min.x ||
            point.x > this.max.x ||
            point.y < this.min.y ||
            point.y > this.max.y ||
            point.z < this.min.z ||
            point.z > this.max.z
            ? false
            : true;
    }
    /**
     * Checks if this box contains the given box
     */
    containsBox(box) {
        return (this.min.x <= box.min.x &&
            box.max.x <= this.max.x &&
            this.min.y <= box.min.y &&
            box.max.y <= this.max.y &&
            this.min.z <= box.min.z &&
            box.max.z <= this.max.z);
    }
    /**
     * Gets a parameter representing the position of a point within this box
     */
    getParameter(point, target = new Vector3()) {
        // This can be used to get the normalized position within the box [0,1]
        return target.set((point.x - this.min.x) / (this.max.x - this.min.x), (point.y - this.min.y) / (this.max.y - this.min.y), (point.z - this.min.z) / (this.max.z - this.min.z));
    }
    /**
     * Checks if this box intersects with another box
     */
    intersectsBox(box) {
        // Using 6 splitting planes to rule out intersections
        return box.max.x < this.min.x ||
            box.min.x > this.max.x ||
            box.max.y < this.min.y ||
            box.min.y > this.max.y ||
            box.max.z < this.min.z ||
            box.min.z > this.max.z
            ? false
            : true;
    }
    /**
     * Clamps a point within this box
     */
    clampPoint(point, target = new Vector3()) {
        return target.copy(point).clamp(this.min, this.max);
    }
    /**
     * Gets the distance from this box to a point
     * If the point is inside the box, returns 0
     */
    distanceToPoint(point) {
        const clampedPoint = new Vector3().copy(point).clamp(this.min, this.max);
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
     * Applies a Matrix4 transformation to this box
     */
    applyMatrix4(matrix) {
        // Transform all 8 corners and recompute the bounding box
        if (this.isEmpty())
            return this;
        const points = [
            new Vector3(),
            new Vector3(),
            new Vector3(),
            new Vector3(),
            new Vector3(),
            new Vector3(),
            new Vector3(),
            new Vector3()
        ];
        points[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(matrix); // 000
        points[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(matrix); // 001
        points[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(matrix); // 010
        points[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(matrix); // 011
        points[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(matrix); // 100
        points[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(matrix); // 101
        points[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(matrix); // 110
        points[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(matrix); // 111
        this.setFromPoints(points);
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
     * Sets this box from an array [minX, minY, minZ, maxX, maxY, maxZ]
     */
    fromArray(array, offset = 0) {
        this.min.fromArray(array, offset);
        this.max.fromArray(array, offset + 3);
        return this;
    }
    /**
     * Returns an array [minX, minY, minZ, maxX, maxY, maxZ]
     */
    toArray(array = [], offset = 0) {
        this.min.toArray(array, offset);
        this.max.toArray(array, offset + 3);
        return array;
    }
    /**
     * Sets this box from a JSON object
     */
    fromJSON(json) {
        this.min.set(json.min.x, json.min.y, json.min.z);
        this.max.set(json.max.x, json.max.y, json.max.z);
        return this;
    }
    /**
     * Returns a JSON representation of this box
     */
    toJSON() {
        return {
            min: { x: this.min.x, y: this.min.y, z: this.min.z },
            max: { x: this.max.x, y: this.max.y, z: this.max.z }
        };
    }
    /**
     * Gets all eight corner points of this box
     */
    getCorners(target = []) {
        target[0] = new Vector3(this.min.x, this.min.y, this.min.z);
        target[1] = new Vector3(this.min.x, this.min.y, this.max.z);
        target[2] = new Vector3(this.min.x, this.max.y, this.min.z);
        target[3] = new Vector3(this.min.x, this.max.y, this.max.z);
        target[4] = new Vector3(this.max.x, this.min.y, this.min.z);
        target[5] = new Vector3(this.max.x, this.min.y, this.max.z);
        target[6] = new Vector3(this.max.x, this.max.y, this.min.z);
        target[7] = new Vector3(this.max.x, this.max.y, this.max.z);
        return target;
    }
    /**
     * Gets the volume of this box
     */
    getVolume() {
        if (this.isEmpty())
            return 0;
        const size = this.getSize();
        return size.x * size.y * size.z;
    }
    /**
     * Gets the surface area of this box
     */
    getSurfaceArea() {
        if (this.isEmpty())
            return 0;
        const size = this.getSize();
        return 2 * (size.x * size.y + size.y * size.z + size.z * size.x);
    }
    /**
     * Gets the diagonal length of this box
     */
    getDiagonalLength() {
        if (this.isEmpty())
            return 0;
        const size = this.getSize();
        return Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);
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
        const isOnBack = Math.abs(point.z - this.min.z) < epsilon;
        const isOnFront = Math.abs(point.z - this.max.z) < epsilon;
        return isOnLeft || isOnRight || isOnBottom || isOnTop || isOnBack || isOnFront;
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
        return `Box3(min: (${this.min.x}, ${this.min.y}, ${this.min.z}), max: (${this.max.x}, ${this.max.y}, ${this.max.z}))`;
    }
    // ===== METHODS REQUIRING ADDITIONAL THREE.JS CLASSES (COMMENTED OUT) =====
    /**
     * Sets this box from a BufferAttribute
     * Requires: BufferAttribute class
     */
    // setFromBufferAttribute(attribute: BufferAttribute): this {
    //   let minX = +Infinity;
    //   let minY = +Infinity;
    //   let minZ = +Infinity;
    //   let maxX = -Infinity;
    //   let maxY = -Infinity;
    //   let maxZ = -Infinity;
    //   for (let i = 0, l = attribute.count; i < l; i++) {
    //     const x = attribute.getX(i);
    //     const y = attribute.getY(i);
    //     const z = attribute.getZ(i);
    //     if (x < minX) minX = x;
    //     if (y < minY) minY = y;
    //     if (z < minZ) minZ = z;
    //     if (x > maxX) maxX = x;
    //     if (y > maxY) maxY = y;
    //     if (z > maxZ) maxZ = z;
    //   }
    //   this.min.set(minX, minY, minZ);
    //   this.max.set(maxX, maxY, maxZ);
    //   return this;
    // }
    /**
     * Sets this box to enclose a sphere
     */
    setFromSphere(sphere) {
        this.min.copy(sphere.center).subScalar(sphere.radius);
        this.max.copy(sphere.center).addScalar(sphere.radius);
        return this;
    }
    /**
     * Checks if this box intersects with a sphere
     */
    intersectsSphere(sphere) {
        // Find the point on the AABB closest to the sphere center
        const clampedPoint = this.clampPoint(sphere.center, new Vector3());
        // If that point is inside the sphere, they intersect
        return clampedPoint.distanceToSquared(sphere.center) <= sphere.radius * sphere.radius;
    }
    /**
     * Checks if this box intersects with a line segment
     */
    intersectsLine(line) {
        // Using the slab method
        // For each axis, compute the intersection t values with the two parallel planes
        const invDir = new Vector3(1 / (line.end.x - line.start.x), 1 / (line.end.y - line.start.y), 1 / (line.end.z - line.start.z));
        const start = line.start;
        // const end = line.end;
        let tmin, tmax, tymin, tymax, tzmin, tzmax;
        if (invDir.x >= 0) {
            tmin = (this.min.x - start.x) * invDir.x;
            tmax = (this.max.x - start.x) * invDir.x;
        }
        else {
            tmin = (this.max.x - start.x) * invDir.x;
            tmax = (this.min.x - start.x) * invDir.x;
        }
        if (invDir.y >= 0) {
            tymin = (this.min.y - start.y) * invDir.y;
            tymax = (this.max.y - start.y) * invDir.y;
        }
        else {
            tymin = (this.max.y - start.y) * invDir.y;
            tymax = (this.min.y - start.y) * invDir.y;
        }
        if (tmin > tymax || tymin > tmax)
            return false;
        if (tymin > tmin)
            tmin = tymin;
        if (tymax < tmax)
            tmax = tymax;
        if (invDir.z >= 0) {
            tzmin = (this.min.z - start.z) * invDir.z;
            tzmax = (this.max.z - start.z) * invDir.z;
        }
        else {
            tzmin = (this.max.z - start.z) * invDir.z;
            tzmax = (this.min.z - start.z) * invDir.z;
        }
        if (tmin > tzmax || tzmin > tmax)
            return false;
        if (tzmin > tmin)
            tmin = tzmin;
        if (tzmax < tmax)
            tmax = tzmax;
        // Check if intersection is within the line segment (t in [0, 1])
        return tmax >= 0 && tmin <= 1;
    }
    /**
     * Checks if this box intersects with a plane
     */
    intersectsPlane(plane) {
        // We compute the minimum and maximum dot product values. If those values
        // are on the same side (back or front) of the plane, then there is no intersection.
        let min, max;
        if (plane.normal.x > 0) {
            min = plane.normal.x * this.min.x;
            max = plane.normal.x * this.max.x;
        }
        else {
            min = plane.normal.x * this.max.x;
            max = plane.normal.x * this.min.x;
        }
        if (plane.normal.y > 0) {
            min += plane.normal.y * this.min.y;
            max += plane.normal.y * this.max.y;
        }
        else {
            min += plane.normal.y * this.max.y;
            max += plane.normal.y * this.min.y;
        }
        if (plane.normal.z > 0) {
            min += plane.normal.z * this.min.z;
            max += plane.normal.z * this.max.z;
        }
        else {
            min += plane.normal.z * this.max.z;
            max += plane.normal.z * this.min.z;
        }
        return min <= -plane.constant && max >= -plane.constant;
    }
    /**
     * Intersects this box with a Ray
     * Returns the intersection point or null if no intersection
     */
    intersectRay(ray, target = new Vector3()) {
        return ray.intersectBox(this, target);
    }
    /**
     * Checks if this box intersects with a Ray
     */
    intersectsRay(ray) {
        return ray.intersectsBox(this);
    }
    /**
     * Checks if this box intersects with a triangle
     * Uses the Separating Axis Theorem (SAT)
     */
    intersectsTriangle(triangle) {
        if (this.isEmpty()) {
            return false;
        }
        // Helper function for SAT test
        const satForAxes = (axes, v0, v1, v2, extents) => {
            for (let i = 0, j = axes.length - 3; i <= j; i += 3) {
                const axis = new Vector3(axes[i], axes[i + 1], axes[i + 2]);
                const axisLen = axis.length();
                if (axisLen === 0)
                    continue;
                const p0 = v0.dot(axis);
                const p1 = v1.dot(axis);
                const p2 = v2.dot(axis);
                const r = extents.x * Math.abs(axis.x) + extents.y * Math.abs(axis.y) + extents.z * Math.abs(axis.z);
                if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
                    return false;
                }
            }
            return true;
        };
        // Compute box center and extents
        const center = this.getCenter(new Vector3());
        const extents = new Vector3().subVectors(this.max, center);
        // Translate triangle to aabb origin
        const v0 = new Vector3().subVectors(triangle.a, center);
        const v1 = new Vector3().subVectors(triangle.b, center);
        const v2 = new Vector3().subVectors(triangle.c, center);
        // Compute edge vectors for triangle
        const f0 = new Vector3().subVectors(v1, v0);
        const f1 = new Vector3().subVectors(v2, v1);
        const f2 = new Vector3().subVectors(v0, v2);
        // Test against axes that are given by cross product combinations
        // of the edges of the triangle and the edges of the aabb
        const axes = [
            0,
            -f0.z,
            f0.y,
            0,
            -f1.z,
            f1.y,
            0,
            -f2.z,
            f2.y,
            f0.z,
            0,
            -f0.x,
            f1.z,
            0,
            -f1.x,
            f2.z,
            0,
            -f2.x,
            -f0.y,
            f0.x,
            0,
            -f1.y,
            f1.x,
            0,
            -f2.y,
            f2.x,
            0
        ];
        if (!satForAxes(axes, v0, v1, v2, extents)) {
            return false;
        }
        // Test 3 face normals from the aabb
        const axesAABB = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        if (!satForAxes(axesAABB, v0, v1, v2, extents)) {
            return false;
        }
        // Finally test the face normal of the triangle
        const triangleNormal = new Vector3().crossVectors(f0, f1);
        const axesTriangle = [triangleNormal.x, triangleNormal.y, triangleNormal.z];
        return satForAxes(axesTriangle, v0, v1, v2, extents);
    }
    /**
     * Gets a bounding sphere that encompasses this box
     */
    getBoundingSphere(target) {
        this.getCenter(target.center);
        target.radius = this.getSize(new Vector3()).length() * 0.5;
        return target;
    }
}

export { Box3 };
