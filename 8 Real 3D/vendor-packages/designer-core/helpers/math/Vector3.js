import { Quaternion } from './Quaternion.js';

/**
 * Custom Vector3 class to replace Three.js Vector3
 * Implements all standalone math methods without requiring other Three.js dependencies
 */
class Vector3 {
    x;
    y;
    z;
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    /**
     * Sets the x, y, and z components of this vector
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    /**
     * Sets all components to the same scalar value
     */
    setScalar(scalar) {
        this.x = scalar;
        this.y = scalar;
        this.z = scalar;
        return this;
    }
    /**
     * Sets the x component
     */
    setX(x) {
        this.x = x;
        return this;
    }
    /**
     * Sets the y component
     */
    setY(y) {
        this.y = y;
        return this;
    }
    /**
     * Sets the z component
     */
    setZ(z) {
        this.z = z;
        return this;
    }
    /**
     * Sets a component by index (0 = x, 1 = y, 2 = z)
     */
    setComponent(index, value) {
        switch (index) {
            case 0:
                this.x = value;
                break;
            case 1:
                this.y = value;
                break;
            case 2:
                this.z = value;
                break;
            default:
                throw new Error('index is out of range: ' + index);
        }
        return this;
    }
    /**
     * Gets a component by index (0 = x, 1 = y, 2 = z)
     */
    getComponent(index) {
        switch (index) {
            case 0:
                return this.x;
            case 1:
                return this.y;
            case 2:
                return this.z;
            default:
                throw new Error('index is out of range: ' + index);
        }
    }
    /**
     * Returns a new Vector3 with the same x, y, and z values
     */
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
    /**
     * Copies the values from another Vector3
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
    /**
     * Adds v to this vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    /**
     * Adds a scalar to all components
     */
    addScalar(s) {
        this.x += s;
        this.y += s;
        this.z += s;
        return this;
    }
    /**
     * Sets this vector to a + b
     */
    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this;
    }
    /**
     * Adds the scaled vector v to this vector
     */
    addScaledVector(v, s) {
        this.x += v.x * s;
        this.y += v.y * s;
        this.z += v.z * s;
        return this;
    }
    /**
     * Subtracts v from this vector
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    /**
     * Subtracts a scalar from all components
     */
    subScalar(s) {
        this.x -= s;
        this.y -= s;
        this.z -= s;
        return this;
    }
    /**
     * Sets this vector to a - b
     */
    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
    }
    /**
     * Multiplies this vector by v component-wise
     */
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }
    /**
     * Multiplies all components by a scalar
     */
    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    /**
     * Multiplies this vector by m component-wise
     */
    multiplyVectors(a, b) {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        return this;
    }
    /**
     * Divides this vector by v component-wise
     */
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;
        return this;
    }
    /**
     * Divides all components by a scalar
     */
    divideScalar(scalar) {
        return this.multiplyScalar(1 / scalar);
    }
    /**
     * Sets this vector's components to the minimum of this and v's components
     */
    min(v) {
        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);
        this.z = Math.min(this.z, v.z);
        return this;
    }
    /**
     * Sets this vector's components to the maximum of this and v's components
     */
    max(v) {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);
        this.z = Math.max(this.z, v.z);
        return this;
    }
    /**
     * Clamps this vector's components between min and max
     */
    clamp(min, max) {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        this.z = Math.max(min.z, Math.min(max.z, this.z));
        return this;
    }
    /**
     * Clamps this vector's components between minVal and maxVal
     */
    clampScalar(minVal, maxVal) {
        this.x = Math.max(minVal, Math.min(maxVal, this.x));
        this.y = Math.max(minVal, Math.min(maxVal, this.y));
        this.z = Math.max(minVal, Math.min(maxVal, this.z));
        return this;
    }
    /**
     * Clamps this vector's length between min and max
     */
    clampLength(min, max) {
        const length = this.length();
        return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));
    }
    /**
     * Rounds down each component to the nearest integer
     */
    floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z);
        return this;
    }
    /**
     * Rounds up each component to the nearest integer
     */
    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);
        return this;
    }
    /**
     * Rounds each component to the nearest integer
     */
    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this;
    }
    /**
     * Rounds each component towards zero (down if positive, up if negative)
     */
    roundToZero() {
        this.x = Math.trunc(this.x);
        this.y = Math.trunc(this.y);
        this.z = Math.trunc(this.z);
        return this;
    }
    /**
     * Negates all components
     */
    negate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }
    /**
     * Computes the dot product with v
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    /**
     * Computes the squared length of this vector
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    /**
     * Computes the length of this vector
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    /**
     * Computes the Manhattan length (taxicab distance)
     */
    manhattanLength() {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }
    /**
     * Normalizes this vector (makes it unit length)
     */
    normalize() {
        return this.divideScalar(this.length() || 1);
    }
    /**
     * Sets the length of this vector to the specified value
     */
    setLength(length) {
        return this.normalize().multiplyScalar(length);
    }
    /**
     * Linearly interpolates between this vector and v by alpha
     */
    lerp(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;
        return this;
    }
    /**
     * Sets this vector to be the linear interpolation between v1 and v2
     */
    lerpVectors(v1, v2, alpha) {
        this.x = v1.x + (v2.x - v1.x) * alpha;
        this.y = v1.y + (v2.y - v1.y) * alpha;
        this.z = v1.z + (v2.z - v1.z) * alpha;
        return this;
    }
    /**
     * Sets this vector to the cross product of itself and v
     */
    cross(v) {
        return this.crossVectors(this, v);
    }
    /**
     * Sets this vector to the cross product of a and b
     */
    crossVectors(a, b) {
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    }
    /**
     * Computes the angle between this vector and v in radians
     */
    angleTo(v) {
        const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
        if (denominator === 0)
            return Math.PI / 2;
        const theta = this.dot(v) / denominator;
        return Math.acos(Math.max(-1, Math.min(1, theta)));
    }
    /**
     * Computes the squared distance to v
     */
    distanceToSquared(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return dx * dx + dy * dy + dz * dz;
    }
    /**
     * Computes the distance to v
     */
    distanceTo(v) {
        return Math.sqrt(this.distanceToSquared(v));
    }
    /**
     * Computes the Manhattan distance to v
     */
    manhattanDistanceTo(v) {
        return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) + Math.abs(this.z - v.z);
    }
    /**
     * Sets this vector from spherical coordinates
     */
    setFromSpherical(s) {
        return this.setFromSphericalCoords(s.radius, s.phi, s.theta);
    }
    /**
     * Sets this vector from spherical coordinates (radius, phi, theta)
     */
    setFromSphericalCoords(radius, phi, theta) {
        const sinPhiRadius = Math.sin(phi) * radius;
        this.x = sinPhiRadius * Math.sin(theta);
        this.y = Math.cos(phi) * radius;
        this.z = sinPhiRadius * Math.cos(theta);
        return this;
    }
    /**
     * Sets this vector from cylindrical coordinates
     */
    setFromCylindrical(c) {
        return this.setFromCylindricalCoords(c.radius, c.theta, c.y);
    }
    /**
     * Sets this vector from cylindrical coordinates (radius, theta, y)
     */
    setFromCylindricalCoords(radius, theta, y) {
        this.x = radius * Math.sin(theta);
        this.y = y;
        this.z = radius * Math.cos(theta);
        return this;
    }
    /**
     * Checks for strict equality with v
     */
    equals(v) {
        return v.x === this.x && v.y === this.y && v.z === this.z;
    }
    /**
     * Sets this vector from an array
     */
    fromArray(array, offset = 0) {
        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];
        return this;
    }
    /**
     * Returns an array [x, y, z]
     */
    toArray(array = [], offset = 0) {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        return array;
    }
    /**
     * Sets components from a BufferAttribute
     */
    fromBufferAttribute(attribute, index) {
        this.x = attribute.getX(index);
        this.y = attribute.getY(index);
        this.z = attribute.getZ(index);
        return this;
    }
    /**
     * Sets this vector to a random direction with unit length
     */
    random() {
        // Using Marsaglia's method for uniform distribution on sphere
        const u = (Math.random() - 0.5) * 2;
        const t = Math.random() * Math.PI * 2;
        const f = Math.sqrt(1 - u ** 2);
        this.x = f * Math.cos(t);
        this.y = f * Math.sin(t);
        this.z = u;
        return this;
    }
    /**
     * Sets this vector to a random position inside a unit sphere
     */
    randomInUnitSphere() {
        // Generate random point in sphere using rejection sampling
        do {
            this.x = Math.random() * 2 - 1;
            this.y = Math.random() * 2 - 1;
            this.z = Math.random() * 2 - 1;
        } while (this.lengthSq() > 1);
        return this;
    }
    /**
     * Generates a random direction and scales it by the radius
     */
    randomDirection() {
        return this.random();
    }
    // ===== METHODS REQUIRING ADDITIONAL THREE.JS CLASSES (COMMENTED OUT) =====
    /**
     * Applies a Matrix3 transformation to this vector
     * Requires: Matrix3 class
     */
    // applyMatrix3(m: Matrix3): this {
    //   const x = this.x, y = this.y, z = this.z;
    //   const e = m.elements;
    //   this.x = e[0] * x + e[3] * y + e[6] * z;
    //   this.y = e[1] * x + e[4] * y + e[7] * z;
    //   this.z = e[2] * x + e[5] * y + e[8] * z;
    //   return this;
    // }
    /**
     * Multiplies this vector by the upper 3x3 of m
     * Requires: Matrix3 class
     */
    // applyNormalMatrix(m: Matrix3): this {
    //   return this.applyMatrix3(m).normalize();
    // }
    /**
     * Applies a Matrix4 transformation to this vector
     */
    applyMatrix4(m) {
        const x = this.x, y = this.y, z = this.z;
        const e = m.elements;
        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
        return this;
    }
    /**
     * Applies a Quaternion transformation to this vector
     */
    applyQuaternion(q) {
        const x = this.x, y = this.y, z = this.z;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        // calculate quat * vector
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        // calculate result * inverse quat
        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        return this;
    }
    /**
     * Applies an Euler transformation to this vector
     */
    applyEuler(euler) {
        // Lazy load Quaternion to avoid circular dependency
        const _quaternion = new Quaternion();
        return this.applyQuaternion(_quaternion.setFromEuler(euler));
    }
    /**
     * Applies an axis-angle rotation to this vector
     */
    applyAxisAngle(axis, angle) {
        // Lazy load Quaternion to avoid circular dependency
        const _quaternion = new Quaternion();
        return this.applyQuaternion(_quaternion.setFromAxisAngle(axis, angle));
    }
    /**
     * Transforms the direction of this vector by a matrix
     */
    transformDirection(m) {
        const x = this.x, y = this.y, z = this.z;
        const e = m.elements;
        this.x = e[0] * x + e[4] * y + e[8] * z;
        this.y = e[1] * x + e[5] * y + e[9] * z;
        this.z = e[2] * x + e[6] * y + e[10] * z;
        return this.normalize();
    }
    /**
     * Projects this vector onto a plane defined by a normal
     */
    projectOnPlane(planeNormal) {
        const _vector = new Vector3();
        _vector.copy(this).projectOnVector(planeNormal);
        return this.sub(_vector);
    }
    /**
     * Projects this vector onto another vector
     */
    projectOnVector(v) {
        const denominator = v.lengthSq();
        if (denominator === 0)
            return this.set(0, 0, 0);
        const scalar = v.dot(this) / denominator;
        return this.copy(v).multiplyScalar(scalar);
    }
    /**
     * Reflects this vector off a plane defined by a normal
     */
    reflect(normal) {
        // reflect incident vector off plane orthogonal to normal
        // normal is assumed to have unit length
        return this.sub(new Vector3().copy(normal).multiplyScalar(2 * this.dot(normal)));
    }
    /**
     * Sets this vector from a matrix position (column 3)
     */
    setFromMatrixPosition(m) {
        const e = m.elements;
        this.x = e[12];
        this.y = e[13];
        this.z = e[14];
        return this;
    }
    /**
     * Sets this vector from the scale component of a matrix
     */
    setFromMatrixScale(m) {
        const sx = new Vector3().setFromMatrixColumn(m, 0).length();
        const sy = new Vector3().setFromMatrixColumn(m, 1).length();
        const sz = new Vector3().setFromMatrixColumn(m, 2).length();
        this.x = sx;
        this.y = sy;
        this.z = sz;
        return this;
    }
    /**
     * Sets this vector from a matrix column
     */
    setFromMatrixColumn(m, index) {
        return this.fromArray(m.elements, index * 4);
    }
    /**
     * Sets this vector from a Matrix3 column
     * Requires: Matrix3 class
     */
    // setFromMatrix3Column(m: Matrix3, index: number): this {
    //   return this.fromArray(m.elements, index * 3);
    // }
    /**
     * Clamps this vector within a Box3
     */
    clampBox(box) {
        this.x = Math.max(box.min.x, Math.min(box.max.x, this.x));
        this.y = Math.max(box.min.y, Math.min(box.max.y, this.y));
        this.z = Math.max(box.min.z, Math.min(box.max.z, this.z));
        return this;
    }
    /**
     * Projects this 3D vector to 2D screen space
     * Requires: Camera class
     */
    project(matrixWorld, projectionMatrix) {
        return this.applyMatrix4(matrixWorld.clone().invert()).applyMatrix4(projectionMatrix);
    }
    /**
     * Unprojects this 2D screen point to 3D space
     * Requires: Camera class
     */
    unproject(matrixWorld, projectionMatrix) {
        return this.applyMatrix4(projectionMatrix.clone().invert()).applyMatrix4(matrixWorld);
    }
}

export { Vector3 };
