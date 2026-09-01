import { Line3 as Line3Class } from './Line3.js';
import { Plane as PlaneClass } from './Plane.js';
import { Vector3 } from './Vector3.js';

/**
 * Custom Triangle class to replace Three.js Triangle
 * Represents a triangle in 3D space defined by three vertices
 */
class Triangle {
    a;
    b;
    c;
    constructor(a, b, c) {
        this.a = a !== undefined ? a : new Vector3();
        this.b = b !== undefined ? b : new Vector3();
        this.c = c !== undefined ? c : new Vector3();
    }
    /**
     * Sets the three vertices of this triangle
     */
    set(a, b, c) {
        this.a.copy(a);
        this.b.copy(b);
        this.c.copy(c);
        return this;
    }
    /**
     * Sets the triangle from an array of points and indices
     */
    setFromPointsAndIndices(points, i0, i1, i2) {
        this.a.copy(points[i0]);
        this.b.copy(points[i1]);
        this.c.copy(points[i2]);
        return this;
    }
    /**
     * Returns a new Triangle with the same vertices
     */
    clone() {
        return new Triangle().copy(this);
    }
    /**
     * Copies the vertices from another Triangle
     */
    copy(triangle) {
        this.a.copy(triangle.a);
        this.b.copy(triangle.b);
        this.c.copy(triangle.c);
        return this;
    }
    /**
     * Gets the area of this triangle
     */
    getArea() {
        const v0 = new Vector3();
        const v1 = new Vector3();
        v0.subVectors(this.c, this.b);
        v1.subVectors(this.a, this.b);
        return v0.cross(v1).length() * 0.5;
    }
    /**
     * Gets the midpoint/centroid of this triangle
     */
    getMidpoint(target = new Vector3()) {
        return target
            .addVectors(this.a, this.b)
            .add(this.c)
            .multiplyScalar(1 / 3);
    }
    /**
     * Gets the normal vector of this triangle (not normalized)
     */
    getNormal(target = new Vector3()) {
        return Triangle.getNormal(this.a, this.b, this.c, target);
    }
    /**
     * Static method to get the normal of a triangle defined by three points
     */
    static getNormal(a, b, c, target = new Vector3()) {
        target.subVectors(c, b);
        const v0 = new Vector3().subVectors(a, b);
        target.cross(v0);
        const targetLengthSq = target.lengthSq();
        if (targetLengthSq > 0) {
            return target.multiplyScalar(1 / Math.sqrt(targetLengthSq));
        }
        return target.set(0, 0, 0);
    }
    /**
     * Gets the plane that contains this triangle
     */
    getPlane(target) {
        return target.setFromCoplanarPoints(this.a, this.b, this.c);
    }
    /**
     * Gets barycentric coordinates of a point relative to this triangle
     */
    getBarycoord(point, target = new Vector3()) {
        return Triangle.getBarycoord(point, this.a, this.b, this.c, target);
    }
    /**
     * Static method to get barycentric coordinates
     */
    static getBarycoord(point, a, b, c, target = new Vector3()) {
        const v0 = new Vector3().subVectors(c, a);
        const v1 = new Vector3().subVectors(b, a);
        const v2 = new Vector3().subVectors(point, a);
        const dot00 = v0.dot(v0);
        const dot01 = v0.dot(v1);
        const dot02 = v0.dot(v2);
        const dot11 = v1.dot(v1);
        const dot12 = v1.dot(v2);
        const denom = dot00 * dot11 - dot01 * dot01;
        // Collinear or singular triangle
        if (denom === 0) {
            // Return an invalid barycentric coordinate
            return target.set(-2, -1, -1);
        }
        const invDenom = 1 / denom;
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
        // Barycentric coordinates must always sum to 1
        return target.set(1 - u - v, v, u);
    }
    /**
     * Gets a UV coordinate at the given point using barycentric coordinates
     */
    static getUV(point, p1, p2, p3, uv1, uv2, uv3, target) {
        const barycoord = Triangle.getBarycoord(point, p1, p2, p3, new Vector3());
        target.x = uv1.x * barycoord.x + uv2.x * barycoord.y + uv3.x * barycoord.z;
        target.y = uv1.y * barycoord.x + uv2.y * barycoord.y + uv3.y * barycoord.z;
        return target;
    }
    /**
     * Checks if a point is inside this triangle
     */
    containsPoint(point) {
        return Triangle.containsPoint(point, this.a, this.b, this.c);
    }
    /**
     * Static method to check if a point is inside a triangle
     */
    static containsPoint(point, a, b, c) {
        const v0 = new Vector3();
        const v1 = new Vector3();
        const v2 = new Vector3();
        v0.subVectors(c, a);
        v1.subVectors(b, a);
        v2.subVectors(point, a);
        const dot00 = v0.dot(v0);
        const dot01 = v0.dot(v1);
        const dot02 = v0.dot(v2);
        const dot11 = v1.dot(v1);
        const dot12 = v1.dot(v2);
        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
        return u >= 0 && v >= 0 && u + v <= 1;
    }
    /**
     * Finds the closest point on this triangle to a given point
     */
    closestPointToPoint(point, target = new Vector3()) {
        const vab = new Vector3();
        const vac = new Vector3();
        const vap = new Vector3();
        const vbp = new Vector3();
        const vcp = new Vector3();
        const a = this.a;
        const b = this.b;
        const c = this.c;
        // Check if P in vertex region outside A
        vab.subVectors(b, a);
        vac.subVectors(c, a);
        vap.subVectors(point, a);
        const d1 = vab.dot(vap);
        const d2 = vac.dot(vap);
        if (d1 <= 0 && d2 <= 0) {
            // Barycentric coordinates (1,0,0)
            return target.copy(a);
        }
        // Check if P in vertex region outside B
        vbp.subVectors(point, b);
        const d3 = vab.dot(vbp);
        const d4 = vac.dot(vbp);
        if (d3 >= 0 && d4 <= d3) {
            // Barycentric coordinates (0,1,0)
            return target.copy(b);
        }
        // Check if P in edge region of AB
        const vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            // Barycentric coordinates (1-v,v,0)
            return target.copy(a).addScaledVector(vab, v);
        }
        // Check if P in vertex region outside C
        vcp.subVectors(point, c);
        const d5 = vab.dot(vcp);
        const d6 = vac.dot(vcp);
        if (d6 >= 0 && d5 <= d6) {
            // Barycentric coordinates (0,0,1)
            return target.copy(c);
        }
        // Check if P in edge region of AC
        const vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const w = d2 / (d2 - d6);
            // Barycentric coordinates (1-w,0,w)
            return target.copy(a).addScaledVector(vac, w);
        }
        // Check if P in edge region of BC
        const va = d3 * d6 - d5 * d4;
        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
            // Barycentric coordinates (0,1-w,w)
            return target.copy(b).add(new Vector3().subVectors(c, b).multiplyScalar(w));
        }
        // P inside face region. Compute Q through its barycentric coordinates (u,v,w)
        const denom = 1 / (va + vb + vc);
        const v = vb * denom;
        const w = vc * denom;
        return target.copy(a).addScaledVector(vab, v).addScaledVector(vac, w);
    }
    /**
     * Gets the distance from a point to this triangle
     */
    distanceToPoint(point) {
        const closestPoint = this.closestPointToPoint(point, new Vector3());
        return point.distanceTo(closestPoint);
    }
    /**
     * Checks for strict equality with another Triangle
     */
    equals(triangle) {
        return triangle.a.equals(this.a) && triangle.b.equals(this.b) && triangle.c.equals(this.c);
    }
    /**
     * Sets this triangle from an array [ax, ay, az, bx, by, bz, cx, cy, cz]
     */
    fromArray(array, offset = 0) {
        this.a.fromArray(array, offset);
        this.b.fromArray(array, offset + 3);
        this.c.fromArray(array, offset + 6);
        return this;
    }
    /**
     * Returns an array [ax, ay, az, bx, by, bz, cx, cy, cz]
     */
    toArray(array = [], offset = 0) {
        this.a.toArray(array, offset);
        this.b.toArray(array, offset + 3);
        this.c.toArray(array, offset + 6);
        return array;
    }
    /**
     * Sets this triangle from a JSON object
     */
    fromJSON(json) {
        this.a.set(json.a.x, json.a.y, json.a.z);
        this.b.set(json.b.x, json.b.y, json.b.z);
        this.c.set(json.c.x, json.c.y, json.c.z);
        return this;
    }
    /**
     * Returns a JSON representation of this triangle
     */
    toJSON() {
        return {
            a: { x: this.a.x, y: this.a.y, z: this.a.z },
            b: { x: this.b.x, y: this.b.y, z: this.b.z },
            c: { x: this.c.x, y: this.c.y, z: this.c.z }
        };
    }
    /**
     * Gets the bounding box that contains this triangle
     */
    getBoundingBox(target) {
        target.makeEmpty();
        target.expandByPoint(this.a);
        target.expandByPoint(this.b);
        target.expandByPoint(this.c);
        return target;
    }
    /**
     * Gets the perimeter of this triangle
     */
    getPerimeter() {
        return this.a.distanceTo(this.b) + this.b.distanceTo(this.c) + this.c.distanceTo(this.a);
    }
    /**
     * Checks if this triangle is degenerate (collinear points)
     */
    isDegenerate(epsilon = 0.0001) {
        return this.getArea() < epsilon;
    }
    /**
     * Gets the three edges of this triangle as Line3 segments
     */
    getEdges() {
        
        return [new Line3Class(this.a, this.b), new Line3Class(this.b, this.c), new Line3Class(this.c, this.a)];
    }
    /**
     * Checks if a point is on the boundary of this triangle (within epsilon)
     */
    isPointOnBoundary(point, epsilon = 0.0001) {
        const edges = this.getEdges();
        return edges.some((edge) => edge.distanceToPoint(point) < epsilon);
    }
    /**
     * Interpolates a point using barycentric coordinates
     */
    static interpolate(p1, p2, p3, u, v, w, target = new Vector3()) {
        target.set(0, 0, 0);
        target.addScaledVector(p1, u);
        target.addScaledVector(p2, v);
        target.addScaledVector(p3, w);
        return target;
    }
    /**
     * Checks if this triangle intersects with a Box3
     */
    intersectsBox(box) {
        return box.intersectsTriangle(this);
    }
    /**
     * Intersects this triangle with a Line3
     * Returns the intersection point or null if no intersection
     */
    intersectLine3(line, target = new Vector3()) {
        // Get the plane of the triangle
        
        const plane = new PlaneClass();
        this.getPlane(plane);
        // First check if the line intersects the plane
        const planeIntersect = plane.intersectLine3(line, target);
        if (planeIntersect === null) {
            return null;
        }
        // Check if the intersection point is inside the triangle
        if (this.containsPoint(planeIntersect)) {
            return target;
        }
        return null;
    }
    /**
     * Checks if this triangle intersects with a Line3
     */
    intersectsLine3(line) {
        return this.intersectLine3(line) !== null;
    }
    /**
     * Returns a string representation of this triangle
     */
    toString() {
        return (`Triangle(` +
            `a: (${this.a.x}, ${this.a.y}, ${this.a.z}), ` +
            `b: (${this.b.x}, ${this.b.y}, ${this.b.z}), ` +
            `c: (${this.c.x}, ${this.c.y}, ${this.c.z}))`);
    }
    // ===== METHODS REQUIRING ADDITIONAL THREE.JS CLASSES (COMMENTED OUT) =====
    /**
     * Sets this triangle from a BufferAttribute
     * Requires: BufferAttribute class
     */
    // setFromBufferAttribute(attribute: BufferAttribute, i0: number, i1: number, i2: number): this {
    //   this.a.fromBufferAttribute(attribute, i0);
    //   this.b.fromBufferAttribute(attribute, i1);
    //   this.c.fromBufferAttribute(attribute, i2);
    //   return this;
    // }
    /**
     * Intersects this triangle with a Ray
     * @param backfaceCulling - Whether to cull backfaces (default: false)
     */
    intersectRay(ray, backfaceCulling = false, target = new Vector3()) {
        return ray.intersectTriangle(this, backfaceCulling, target);
    }
    /**
     * Checks if this triangle intersects with a Ray
     * @param backfaceCulling - Whether to cull backfaces (default: false)
     */
    intersectsRay(ray, backfaceCulling = false) {
        return ray.intersectsTriangle(this, backfaceCulling);
    }
}

export { Triangle };
