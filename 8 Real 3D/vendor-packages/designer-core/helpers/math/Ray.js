import { Vector3 } from './Vector3.js';

/**
 * Custom Ray class to replace Three.js Ray
 * Represents a ray in 3D space defined by an origin point and a direction vector
 * The ray equation is: origin + t * direction (where t >= 0)
 */
class Ray {
    origin;
    direction;
    constructor(origin, direction) {
        this.origin = origin !== undefined ? origin : new Vector3();
        this.direction = direction !== undefined ? direction : new Vector3(0, 0, -1);
    }
    /**
     * Sets the origin and direction of this ray
     */
    set(origin, direction) {
        this.origin.copy(origin);
        this.direction.copy(direction);
        return this;
    }
    /**
     * Returns a new Ray with the same origin and direction
     */
    clone() {
        return new Ray().copy(this);
    }
    /**
     * Copies the origin and direction from another Ray
     */
    copy(ray) {
        this.origin.copy(ray.origin);
        this.direction.copy(ray.direction);
        return this;
    }
    /**
     * Gets a point at a distance t along the ray
     * @param t - Distance along the ray (t >= 0)
     */
    at(t, target = new Vector3()) {
        return target.copy(this.direction).multiplyScalar(t).add(this.origin);
    }
    /**
     * Sets the direction to point from the origin to the target
     */
    lookAt(target) {
        this.direction.copy(target).sub(this.origin).normalize();
        return this;
    }
    /**
     * Shifts the origin of the ray along its direction by distance t
     */
    recast(t) {
        this.origin.copy(this.at(t, new Vector3()));
        return this;
    }
    /**
     * Finds the closest point on the ray to a given point
     */
    closestPointToPoint(point, target = new Vector3()) {
        target.subVectors(point, this.origin);
        const directionDistance = target.dot(this.direction);
        if (directionDistance < 0) {
            return target.copy(this.origin);
        }
        return target.copy(this.direction).multiplyScalar(directionDistance).add(this.origin);
    }
    /**
     * Gets the squared distance from the ray to a point
     */
    distanceSqToPoint(point) {
        const v1 = new Vector3();
        const directionDistance = v1.subVectors(point, this.origin).dot(this.direction);
        // Point behind the ray
        if (directionDistance < 0) {
            return this.origin.distanceToSquared(point);
        }
        v1.copy(this.direction).multiplyScalar(directionDistance).add(this.origin);
        return v1.distanceToSquared(point);
    }
    /**
     * Gets the distance from the ray to a point
     */
    distanceToPoint(point) {
        return Math.sqrt(this.distanceSqToPoint(point));
    }
    /**
     * Gets the squared distance from the ray to a plane
     */
    distanceSqToPlane(plane) {
        const denominator = plane.normal.dot(this.direction);
        if (denominator === 0) {
            // Ray is parallel to plane
            if (plane.distanceToPoint(this.origin) === 0) {
                return 0; // Ray is on the plane
            }
            return Infinity; // Ray is parallel but not on plane
        }
        const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator;
        // If t >= 0, ray intersects or will intersect the plane
        return t >= 0 ? 0 : Infinity;
    }
    /**
     * Gets the distance from the ray to a plane
     */
    distanceToPlane(plane) {
        const distSq = this.distanceSqToPlane(plane);
        return distSq === Infinity ? Infinity : Math.sqrt(distSq);
    }
    /**
     * Intersects this ray with a plane
     * Returns the intersection point or null if no intersection
     */
    intersectPlane(plane, target = new Vector3()) {
        const denominator = plane.normal.dot(this.direction);
        if (denominator === 0) {
            // Ray is parallel to plane
            if (plane.distanceToPoint(this.origin) === 0) {
                // Ray is on the plane
                return target.copy(this.origin);
            }
            return null;
        }
        const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator;
        // Ray intersects plane behind origin
        if (t < 0) {
            return null;
        }
        return this.at(t, target);
    }
    /**
     * Checks if this ray intersects a plane
     */
    intersectsPlane(plane) {
        return this.distanceSqToPlane(plane) !== Infinity;
    }
    /**
     * Intersects this ray with a Box3
     * Returns the intersection point or null if no intersection
     */
    intersectBox(box, target = new Vector3()) {
        let tmin, tmax, tymin, tymax, tzmin, tzmax;
        const invdirx = 1 / this.direction.x;
        const invdiry = 1 / this.direction.y;
        const invdirz = 1 / this.direction.z;
        const origin = this.origin;
        if (invdirx >= 0) {
            tmin = (box.min.x - origin.x) * invdirx;
            tmax = (box.max.x - origin.x) * invdirx;
        }
        else {
            tmin = (box.max.x - origin.x) * invdirx;
            tmax = (box.min.x - origin.x) * invdirx;
        }
        if (invdiry >= 0) {
            tymin = (box.min.y - origin.y) * invdiry;
            tymax = (box.max.y - origin.y) * invdiry;
        }
        else {
            tymin = (box.max.y - origin.y) * invdiry;
            tymax = (box.min.y - origin.y) * invdiry;
        }
        if (tmin > tymax || tymin > tmax)
            return null;
        if (tymin > tmin || isNaN(tmin))
            tmin = tymin;
        if (tymax < tmax || isNaN(tmax))
            tmax = tymax;
        if (invdirz >= 0) {
            tzmin = (box.min.z - origin.z) * invdirz;
            tzmax = (box.max.z - origin.z) * invdirz;
        }
        else {
            tzmin = (box.max.z - origin.z) * invdirz;
            tzmax = (box.min.z - origin.z) * invdirz;
        }
        if (tmin > tzmax || tzmin > tmax)
            return null;
        if (tzmin > tmin || tmin !== tmin)
            tmin = tzmin;
        if (tzmax < tmax || tmax !== tmax)
            tmax = tzmax;
        // Ray intersects box but behind origin
        if (tmax < 0)
            return null;
        return this.at(tmin >= 0 ? tmin : tmax, target);
    }
    /**
     * Checks if this ray intersects a Box3
     */
    intersectsBox(box) {
        return this.intersectBox(box) !== null;
    }
    /**
     * Intersects this ray with a Sphere
     * Returns the intersection point or null if no intersection
     */
    intersectSphere(sphere, target = new Vector3()) {
        const v1 = new Vector3();
        v1.subVectors(sphere.center, this.origin);
        const tca = v1.dot(this.direction);
        const d2 = v1.dot(v1) - tca * tca;
        const radius2 = sphere.radius * sphere.radius;
        if (d2 > radius2)
            return null;
        const thc = Math.sqrt(radius2 - d2);
        // t0 = first intersect point - entrance on front of sphere
        const t0 = tca - thc;
        // t1 = second intersect point - exit point on back of sphere
        const t1 = tca + thc;
        // Both t0 and t1 are behind the ray - no intersection
        if (t1 < 0)
            return null;
        // t0 is behind the ray - ray starts inside sphere
        // Return the exit point
        if (t0 < 0)
            return this.at(t1, target);
        // Return the entrance point
        return this.at(t0, target);
    }
    /**
     * Checks if this ray intersects a Sphere
     */
    intersectsSphere(sphere) {
        return this.distanceSqToPoint(sphere.center) <= sphere.radius * sphere.radius;
    }
    /**
     * Intersects this ray with a Triangle using Möller–Trumbore algorithm
     * Returns the intersection point or null if no intersection
     */
    intersectTriangle(triangle, backfaceCulling, target = new Vector3()) {
        // Möller–Trumbore intersection algorithm
        const edge1 = new Vector3();
        const edge2 = new Vector3();
        const normal = new Vector3();
        const a = triangle.a;
        const b = triangle.b;
        const c = triangle.c;
        edge1.subVectors(b, a);
        edge2.subVectors(c, a);
        normal.crossVectors(edge1, edge2);
        // Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
        // E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
        //   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
        //   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
        //   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
        let DdN = this.direction.dot(normal);
        let sign;
        if (DdN > 0) {
            if (backfaceCulling)
                return null;
            sign = 1;
        }
        else if (DdN < 0) {
            sign = -1;
            DdN = -DdN;
        }
        else {
            return null;
        }
        const diff = new Vector3();
        diff.subVectors(this.origin, a);
        const DdQxE2 = sign * this.direction.dot(new Vector3().crossVectors(diff, edge2));
        // b1 < 0, no intersection
        if (DdQxE2 < 0) {
            return null;
        }
        const DdE1xQ = sign * this.direction.dot(new Vector3().crossVectors(edge1, diff));
        // b2 < 0, no intersection
        if (DdE1xQ < 0) {
            return null;
        }
        // b1+b2 > 1, no intersection
        if (DdQxE2 + DdE1xQ > DdN) {
            return null;
        }
        // Line intersects triangle, check if ray does.
        const QdN = -sign * diff.dot(normal);
        // t < 0, no intersection
        if (QdN < 0) {
            return null;
        }
        // Ray intersects triangle.
        return this.at(QdN / DdN, target);
    }
    /**
     * Checks if this ray intersects a Triangle
     */
    intersectsTriangle(triangle, backfaceCulling = false) {
        return this.intersectTriangle(triangle, backfaceCulling) !== null;
    }
    /**
     * Applies a Matrix4 transformation to this ray
     */
    applyMatrix4(matrix4) {
        this.origin.applyMatrix4(matrix4);
        this.direction.transformDirection(matrix4);
        return this;
    }
    /**
     * Checks for strict equality with another Ray
     */
    equals(ray) {
        return ray.origin.equals(this.origin) && ray.direction.equals(this.direction);
    }
    /**
     * Sets this ray from an array [originX, originY, originZ, directionX, directionY, directionZ]
     */
    fromArray(array, offset = 0) {
        this.origin.fromArray(array, offset);
        this.direction.fromArray(array, offset + 3);
        return this;
    }
    /**
     * Returns an array [originX, originY, originZ, directionX, directionY, directionZ]
     */
    toArray(array = [], offset = 0) {
        this.origin.toArray(array, offset);
        this.direction.toArray(array, offset + 3);
        return array;
    }
    /**
     * Sets this ray from a JSON object
     */
    fromJSON(json) {
        this.origin.set(json.origin.x, json.origin.y, json.origin.z);
        this.direction.set(json.direction.x, json.direction.y, json.direction.z);
        return this;
    }
    /**
     * Returns a JSON representation of this ray
     */
    toJSON() {
        return {
            origin: { x: this.origin.x, y: this.origin.y, z: this.origin.z },
            direction: { x: this.direction.x, y: this.direction.y, z: this.direction.z }
        };
    }
    /**
     * Checks if a point lies on this ray (within epsilon tolerance)
     */
    containsPoint(point, epsilon = 0.0001) {
        return this.distanceToPoint(point) < epsilon;
    }
    /**
     * Gets the parameter t for a point on the ray
     * Returns -1 if the point is not on the ray
     */
    getParameterAt(point, epsilon = 0.0001) {
        const diff = new Vector3().subVectors(point, this.origin);
        const t = diff.dot(this.direction);
        if (t < 0)
            return -1;
        const testPoint = this.at(t, new Vector3());
        if (testPoint.distanceTo(point) < epsilon) {
            return t;
        }
        return -1;
    }
    /**
     * Returns a string representation of this ray
     */
    toString() {
        return (`Ray(` +
            `origin: (${this.origin.x}, ${this.origin.y}, ${this.origin.z}), ` +
            `direction: (${this.direction.x}, ${this.direction.y}, ${this.direction.z}))`);
    }
}

export { Ray };
