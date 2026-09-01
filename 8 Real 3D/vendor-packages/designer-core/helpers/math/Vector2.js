/**
 * Custom Vector2 class to replace Three.js Vector2
 * Implements all standalone math methods without requiring other Three.js dependencies
 */
class Vector2 {
    x;
    y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    /**
     * Getters for width/height aliases
     */
    get width() {
        return this.x;
    }
    set width(value) {
        this.x = value;
    }
    get height() {
        return this.y;
    }
    set height(value) {
        this.y = value;
    }
    /**
     * Sets the x and y components of this vector
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    /**
     * Sets both components to the same scalar value
     */
    setScalar(scalar) {
        this.x = scalar;
        this.y = scalar;
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
     * Sets a component by index (0 = x, 1 = y)
     */
    setComponent(index, value) {
        switch (index) {
            case 0:
                this.x = value;
                break;
            case 1:
                this.y = value;
                break;
            default:
                throw new Error('index is out of range: ' + index);
        }
        return this;
    }
    /**
     * Gets a component by index (0 = x, 1 = y)
     */
    getComponent(index) {
        switch (index) {
            case 0:
                return this.x;
            case 1:
                return this.y;
            default:
                throw new Error('index is out of range: ' + index);
        }
    }
    /**
     * Returns a new Vector2 with the same x and y values
     */
    clone() {
        return new Vector2(this.x, this.y);
    }
    /**
     * Copies the values from another Vector2
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    /**
     * Adds v to this vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    /**
     * Adds a scalar to both components
     */
    addScalar(s) {
        this.x += s;
        this.y += s;
        return this;
    }
    /**
     * Sets this vector to a + b
     */
    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        return this;
    }
    /**
     * Adds the scaled vector v to this vector
     */
    addScaledVector(v, s) {
        this.x += v.x * s;
        this.y += v.y * s;
        return this;
    }
    /**
     * Subtracts v from this vector
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    /**
     * Subtracts a scalar from both components
     */
    subScalar(s) {
        this.x -= s;
        this.y -= s;
        return this;
    }
    /**
     * Sets this vector to a - b
     */
    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this;
    }
    /**
     * Multiplies this vector by v component-wise
     */
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }
    /**
     * Multiplies both components by a scalar
     */
    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    /**
     * Divides this vector by v component-wise
     */
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;
        return this;
    }
    /**
     * Divides both components by a scalar
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
        return this;
    }
    /**
     * Sets this vector's components to the maximum of this and v's components
     */
    max(v) {
        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);
        return this;
    }
    /**
     * Clamps this vector's components between min and max
     */
    clamp(min, max) {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        return this;
    }
    /**
     * Clamps this vector's components between minVal and maxVal
     */
    clampScalar(minVal, maxVal) {
        this.x = Math.max(minVal, Math.min(maxVal, this.x));
        this.y = Math.max(minVal, Math.min(maxVal, this.y));
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
        return this;
    }
    /**
     * Rounds up each component to the nearest integer
     */
    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }
    /**
     * Rounds each component to the nearest integer
     */
    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
    /**
     * Rounds each component towards zero (down if positive, up if negative)
     */
    roundToZero() {
        this.x = Math.trunc(this.x);
        this.y = Math.trunc(this.y);
        return this;
    }
    /**
     * Negates both components
     */
    negate() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
    /**
     * Computes the dot product with v
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    /**
     * Computes the cross product with v (returns scalar for 2D)
     */
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    /**
     * Computes the squared length of this vector
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }
    /**
     * Computes the length of this vector
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    /**
     * Computes the Manhattan length (taxicab distance)
     */
    manhattanLength() {
        return Math.abs(this.x) + Math.abs(this.y);
    }
    /**
     * Normalizes this vector (makes it unit length)
     */
    normalize() {
        return this.divideScalar(this.length() || 1);
    }
    /**
     * Computes the angle in radians with respect to the positive x-axis
     */
    angle() {
        // Angle in radians with respect to the positive x-axis
        const angle = Math.atan2(-this.y, -this.x) + Math.PI;
        return angle;
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
        return dx * dx + dy * dy;
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
        return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
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
        return this;
    }
    /**
     * Sets this vector to be the linear interpolation between v1 and v2
     */
    lerpVectors(v1, v2, alpha) {
        this.x = v1.x + (v2.x - v1.x) * alpha;
        this.y = v1.y + (v2.y - v1.y) * alpha;
        return this;
    }
    /**
     * Checks for strict equality with v
     */
    equals(v) {
        return v.x === this.x && v.y === this.y;
    }
    /**
     * Sets this vector from an array
     */
    fromArray(array, offset = 0) {
        this.x = array[offset];
        this.y = array[offset + 1];
        return this;
    }
    /**
     * Returns an array [x, y]
     */
    toArray(array = [], offset = 0) {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        return array;
    }
    /**
     * Sets components from a BufferAttribute
     */
    fromBufferAttribute(attribute, index) {
        this.x = attribute.getX(index);
        this.y = attribute.getY(index);
        return this;
    }
    /**
     * Rotates this vector around center by angle radians
     */
    rotateAround(center = new Vector2(), angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = this.x - center.x;
        const y = this.y - center.y;
        this.x = x * c - y * s + center.x;
        this.y = x * s + y * c + center.y;
        return this;
    }
    /**
     * Sets this vector to a random direction with unit length
     */
    random() {
        const angle = Math.random() * Math.PI * 2;
        this.x = Math.cos(angle);
        this.y = Math.sin(angle);
        return this;
    }
    /**
     * Sets this vector to a random position inside a unit circle
     */
    randomInUnitCircle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()); // Square root for uniform distribution
        this.x = Math.cos(angle) * radius;
        this.y = Math.sin(angle) * radius;
        return this;
    }
    // ===== METHODS REQUIRING ADDITIONAL THREE.JS CLASSES (COMMENTED OUT) =====
    /**
     * Applies a Matrix3 transformation to this vector
     */
    applyMatrix3(m) {
        const x = this.x, y = this.y;
        const e = m.elements;
        this.x = e[0] * x + e[3] * y + e[6];
        this.y = e[1] * x + e[4] * y + e[7];
        return this;
    }
    /**
     * Transforms this vector by a 4x3 affine transformation matrix
     */
    applyMatrix4(m) {
        const x = this.x, y = this.y;
        const e = m.elements;
        this.x = e[0] * x + e[4] * y + e[12];
        this.y = e[1] * x + e[5] * y + e[13];
        return this;
    }
    /**
     * Multiplies this vector (with an implicit 1 as the 3rd component) by m
     * Requires: Matrix3 class
     */
    // transformDirection(m: Matrix3): this {
    //   const x = this.x, y = this.y;
    //   const e = m.elements;
    //   this.x = e[0] * x + e[3] * y;
    //   this.y = e[1] * x + e[4] * y;
    //   return this.normalize();
    // }
    /**
     * Clamps this vector to the boundaries of a Box2
     */
    clampBox(box) {
        this.x = Math.max(box.min.x, Math.min(box.max.x, this.x));
        this.y = Math.max(box.min.y, Math.min(box.max.y, this.y));
        return this;
    }
}

export { Vector2 };
