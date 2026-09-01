import { Vector3 } from './Vector3.js';

const _d1 = new Vector3();
const _d2 = new Vector3();
const _r = new Vector3();
const _c1 = new Vector3();
const _c2 = new Vector3();
const _near = new Vector3();
const _far = new Vector3();
/**
 * Custom Line3 class to replace Three.js Line3
 * Represents a line segment in 3D space defined by a start and end point
 */
class Line3 {
    start;
    end;
    constructor(start, end) {
        this.start = start !== undefined ? start : new Vector3();
        this.end = end !== undefined ? end : new Vector3();
    }
    /**
     * Sets the start and end points of this line
     */
    set(start, end) {
        this.start.copy(start);
        this.end.copy(end);
        return this;
    }
    /**
     * Sets the start and end points of this line from a Ray
     */
    setFromRay(ray) {
        this.start.copy(ray.origin);
        this.end.copy(ray.direction.clone().multiplyScalar(1000).add(ray.origin));
        return this;
    }
    /**
     * Creates a Line3 from the camera's near plane to far plane through
     * a given NDC screen point. Works for both perspective and orthographic cameras.
     *
     * @param ndc                   - Normalized device coordinates in [-1, 1]
     * @param projectionMatrixInverse - camera.projectionMatrixInverse
     * @param cameraMatrixWorld       - camera.matrixWorld
     */
    setFromCamera(ndc, projectionMatrixInverse, cameraMatrixWorld) {
        _near
            .set(ndc.x, ndc.y, -1) // NDC near plane
            .applyMatrix4(projectionMatrixInverse)
            .applyMatrix4(cameraMatrixWorld);
        _far
            .set(ndc.x, ndc.y, 1) // NDC far plane
            .applyMatrix4(projectionMatrixInverse)
            .applyMatrix4(cameraMatrixWorld);
        this.start.copy(_near);
        this.end.copy(_far);
        return this;
    }
    /**
     * Returns a new Line3 with the same start and end points
     */
    clone() {
        return new Line3().copy(this);
    }
    /**
     * Copies the start and end points from another Line3
     */
    copy(line) {
        this.start.copy(line.start);
        this.end.copy(line.end);
        return this;
    }
    /**
     * Gets the center point of this line segment
     */
    getCenter(target = new Vector3()) {
        return target.addVectors(this.start, this.end).multiplyScalar(0.5);
    }
    /**
     * Gets the delta vector (end - start)
     */
    delta(target = new Vector3()) {
        return target.subVectors(this.end, this.start);
    }
    /**
     * Gets the squared distance between start and end
     */
    distanceSq() {
        return this.start.distanceToSquared(this.end);
    }
    /**
     * Gets the distance between start and end (line segment length)
     */
    distance() {
        return this.start.distanceTo(this.end);
    }
    /**
     * Gets a point at a parameter t along the line (t=0 is start, t=1 is end)
     */
    at(t, target = new Vector3()) {
        return this.delta(target).multiplyScalar(t).add(this.start);
    }
    /**
     * Finds the parameter t for the closest point on the line to the given point
     * Returns value clamped between 0 and 1
     */
    closestPointToPointParameter(point, clampToLine = true) {
        const _startP = new Vector3();
        const _startEnd = new Vector3();
        _startP.subVectors(point, this.start);
        _startEnd.subVectors(this.end, this.start);
        const startEnd2 = _startEnd.dot(_startEnd);
        const startEnd_startP = _startEnd.dot(_startP);
        let t = startEnd_startP / startEnd2;
        if (clampToLine) {
            t = Math.max(0, Math.min(1, t));
        }
        return t;
    }
    /**
     * Finds the closest point on the line segment to the given point
     */
    closestPointToPoint(point, clampToLine = true, target = new Vector3()) {
        const t = this.closestPointToPointParameter(point, clampToLine);
        return this.delta(target).multiplyScalar(t).add(this.start);
    }
    /**
     * Applies a Matrix4 transformation to this line
     */
    applyMatrix4(matrix) {
        this.start.applyMatrix4(matrix);
        this.end.applyMatrix4(matrix);
        return this;
    }
    /**
     * Checks for strict equality with another Line3
     */
    equals(line) {
        return line.start.equals(this.start) && line.end.equals(this.end);
    }
    /**
     * Sets this line from an array [startX, startY, startZ, endX, endY, endZ]
     */
    fromArray(array, offset = 0) {
        this.start.fromArray(array, offset);
        this.end.fromArray(array, offset + 3);
        return this;
    }
    /**
     * Returns an array [startX, startY, startZ, endX, endY, endZ]
     */
    toArray(array = [], offset = 0) {
        this.start.toArray(array, offset);
        this.end.toArray(array, offset + 3);
        return array;
    }
    /**
     * Sets this line from a JSON object
     */
    fromJSON(json) {
        this.start.set(json.start.x, json.start.y, json.start.z);
        this.end.set(json.end.x, json.end.y, json.end.z);
        return this;
    }
    /**
     * Returns a JSON representation of this line
     */
    toJSON() {
        return {
            start: { x: this.start.x, y: this.start.y, z: this.start.z },
            end: { x: this.end.x, y: this.end.y, z: this.end.z }
        };
    }
    /**
     * Gets the squared distance from a point to this line segment
     */
    distanceToPointSq(point) {
        const closestPoint = this.closestPointToPoint(point, true, new Vector3());
        return point.distanceToSquared(closestPoint);
    }
    /**
     * Gets the distance from a point to this line segment
     */
    distanceToPoint(point) {
        return Math.sqrt(this.distanceToPointSq(point));
    }
    /**
     * Returns the squared distance between this segment and the given one.
     * Also writes the closest point on this segment into c1, and the closest
     * point on the given segment into c2.
     *
     * Port of Three.js r183 Line3.distanceSqToLine3 — Ericson, "Real-Time
     * Collision Detection", chapter 5.1.9.
     */
    distanceSqToLine3(line, c1 = _c1, c2 = _c2) {
        const EPSILON = 1e-16; // 1e-8 squared
        const p1 = this.start, q1 = this.end;
        const p2 = line.start, q2 = line.end;
        _d1.subVectors(q1, p1); // direction of this segment
        _d2.subVectors(q2, p2); // direction of given segment
        _r.subVectors(p1, p2);
        const a = _d1.dot(_d1); // squared length of this segment
        const e = _d2.dot(_d2); // squared length of given segment
        const f = _d2.dot(_r);
        let s, t;
        if (a <= EPSILON && e <= EPSILON) {
            // Both segments degenerate into points
            c1.copy(p1);
            c2.copy(p2);
            return c1.distanceToSquared(c2);
        }
        if (a <= EPSILON) {
            // This segment degenerates into a point
            s = 0;
            t = Math.max(0, Math.min(1, f / e));
        }
        else {
            const c = _d1.dot(_r);
            if (e <= EPSILON) {
                // Given segment degenerates into a point
                t = 0;
                s = Math.max(0, Math.min(1, -c / a));
            }
            else {
                const b = _d1.dot(_d2);
                const denom = a * e - b * b; // always >= 0
                s = denom !== 0 ? Math.max(0, Math.min(1, (b * f - c * e) / denom)) : 0; // parallel — pick arbitrary s
                t = (b * s + f) / e;
                // If t outside [0,1], clamp and recompute s
                if (t < 0) {
                    t = 0;
                    s = Math.max(0, Math.min(1, -c / a));
                }
                else if (t > 1) {
                    t = 1;
                    s = Math.max(0, Math.min(1, (b - c) / a));
                }
            }
        }
        c1.copy(p1).addScaledVector(_d1, s);
        c2.copy(p2).addScaledVector(_d2, t);
        return c1.distanceToSquared(c2);
    }
    /**
     * Checks if a point lies on this line segment (within epsilon tolerance)
     */
    containsPoint(point, epsilon = 0.0001) {
        return this.distanceToPoint(point) < epsilon;
    }
    /**
     * Gets the direction vector of this line (normalized)
     */
    getDirection(target = new Vector3()) {
        return this.delta(target).normalize();
    }
    /**
     * Checks if this line segment intersects a Box3
     */
    intersectsBox(box) {
        return box.intersectsLine(this);
    }
    /**
     * Checks if this line segment intersects a Sphere
     */
    intersectsSphere(sphere) {
        return sphere.intersectsLine(this);
    }
    /**
     * Finds the intersection point of this line with a Plane
     * Returns null if the line is parallel to the plane or doesn't intersect
     */
    intersectPlane(plane, target = new Vector3()) {
        const direction = this.delta(new Vector3());
        const denominator = plane.normal.dot(direction);
        // Line is parallel to plane
        if (denominator === 0) {
            // Line is coplanar, return null
            if (plane.distanceToPoint(this.start) === 0) {
                return null;
            }
            return null;
        }
        const t = -(this.start.dot(plane.normal) + plane.constant) / denominator;
        // Check if intersection is within the line segment
        if (t < 0 || t > 1) {
            return null;
        }
        return this.at(t, target);
    }
    /**
     * Checks if this line intersects with a Plane
     */
    intersectsPlane(plane) {
        // Compute signed distances from endpoints to plane
        const distStart = plane.distanceToPoint(this.start);
        const distEnd = plane.distanceToPoint(this.end);
        // If signs differ, the line crosses the plane
        return (distStart < 0 && distEnd > 0) || (distStart > 0 && distEnd < 0);
    }
    /**
     * Reverses the direction of this line (swaps start and end)
     */
    reverse() {
        const temp = this.start.clone();
        this.start.copy(this.end);
        this.end.copy(temp);
        return this;
    }
    /**
     * Scales this line segment from its center
     */
    scale(scalar) {
        const center = this.getCenter(new Vector3());
        const direction = this.delta(new Vector3()).multiplyScalar(scalar * 0.5);
        this.start.copy(center).sub(direction);
        this.end.copy(center).add(direction);
        return this;
    }
    /**
     * Translates this line by an offset vector
     */
    translate(offset) {
        this.start.add(offset);
        this.end.add(offset);
        return this;
    }
    /**
     * Gets the bounding box that contains this line segment
     */
    getBoundingBox(target) {
        target.makeEmpty();
        target.expandByPoint(this.start);
        target.expandByPoint(this.end);
        return target;
    }
    /**
     * Gets the bounding sphere that contains this line segment
     */
    getBoundingSphere(target) {
        this.getCenter(target.center);
        target.radius = this.distance() * 0.5;
        return target;
    }
    /**
     * Computes the minimum distance between this line segment and another
     */
    distanceToLine(line) {
        // Implementation based on Dan Sunday's algorithm
        const u = this.delta(new Vector3());
        const v = line.delta(new Vector3());
        const w = new Vector3().subVectors(this.start, line.start);
        const a = u.dot(u); // always >= 0
        const b = u.dot(v);
        const c = v.dot(v); // always >= 0
        const d = u.dot(w);
        const e = v.dot(w);
        const D = a * c - b * b; // always >= 0
        let sc, sN, sD = D; // sc = sN / sD, default sD = D >= 0
        let tc, tN, tD = D; // tc = tN / tD, default tD = D >= 0
        // Compute the line parameters of the two closest points
        if (D < 0.0000001) {
            // Lines are almost parallel
            sN = 0.0;
            sD = 1.0;
            tN = e;
            tD = c;
        }
        else {
            // Get the closest points on the infinite lines
            sN = b * e - c * d;
            tN = a * e - b * d;
            if (sN < 0.0) {
                // sc < 0 => the s=0 edge is visible
                sN = 0.0;
                tN = e;
                tD = c;
            }
            else if (sN > sD) {
                // sc > 1  => the s=1 edge is visible
                sN = sD;
                tN = e + b;
                tD = c;
            }
        }
        if (tN < 0.0) {
            // tc < 0 => the t=0 edge is visible
            tN = 0.0;
            // Recompute sc for this edge
            if (-d < 0.0) {
                sN = 0.0;
            }
            else if (-d > a) {
                sN = sD;
            }
            else {
                sN = -d;
                sD = a;
            }
        }
        else if (tN > tD) {
            // tc > 1  => the t=1 edge is visible
            tN = tD;
            // Recompute sc for this edge
            if (-d + b < 0.0) {
                sN = 0;
            }
            else if (-d + b > a) {
                sN = sD;
            }
            else {
                sN = -d + b;
                sD = a;
            }
        }
        // Finally do the division to get sc and tc
        sc = Math.abs(sN) < 0.0000001 ? 0.0 : sN / sD;
        tc = Math.abs(tN) < 0.0000001 ? 0.0 : tN / tD;
        // Get the difference of the two closest points
        const dP = new Vector3().copy(w).add(u.multiplyScalar(sc)).sub(v.multiplyScalar(tc));
        return dP.length();
    }
    /**
     * Finds the closest points on this line and another line segment
     * Returns parameters [t1, t2] where t1 is on this line and t2 is on the other line
     */
    closestPointsToLine(line) {
        const u = this.delta(new Vector3());
        const v = line.delta(new Vector3());
        const w = new Vector3().subVectors(this.start, line.start);
        const a = u.dot(u);
        const b = u.dot(v);
        const c = v.dot(v);
        const d = u.dot(w);
        const e = v.dot(w);
        const D = a * c - b * b;
        let sc, sN, sD = D;
        let tc, tN, tD = D;
        if (D < 0.0000001) {
            sN = 0.0;
            sD = 1.0;
            tN = e;
            tD = c;
        }
        else {
            sN = b * e - c * d;
            tN = a * e - b * d;
            if (sN < 0.0) {
                sN = 0.0;
                tN = e;
                tD = c;
            }
            else if (sN > sD) {
                sN = sD;
                tN = e + b;
                tD = c;
            }
        }
        if (tN < 0.0) {
            tN = 0.0;
            if (-d < 0.0) {
                sN = 0.0;
            }
            else if (-d > a) {
                sN = sD;
            }
            else {
                sN = -d;
                sD = a;
            }
        }
        else if (tN > tD) {
            tN = tD;
            if (-d + b < 0.0) {
                sN = 0;
            }
            else if (-d + b > a) {
                sN = sD;
            }
            else {
                sN = -d + b;
                sD = a;
            }
        }
        sc = Math.abs(sN) < 0.0000001 ? 0.0 : sN / sD;
        tc = Math.abs(tN) < 0.0000001 ? 0.0 : tN / tD;
        return {
            thisPoint: this.at(sc),
            otherPoint: line.at(tc),
            thisT: sc,
            otherT: tc
        };
    }
    /**
     * Returns a string representation of this line
     */
    toString() {
        return `Line3(start: (${this.start.x}, ${this.start.y}, ${this.start.z}), end: (${this.end.x}, ${this.end.y}, ${this.end.z}))`;
    }
}

export { Line3 };
