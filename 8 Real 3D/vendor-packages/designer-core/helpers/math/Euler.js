import { getMonitor } from '../monitor.js';
import { Matrix4 } from './Matrix4.js';
import { Vector3 } from './Vector3.js';

const DefaultEulerOrder = 'XYZ';
class Euler {
    x;
    y;
    z;
    order;
    constructor(x = 0, y = 0, z = 0, order = DefaultEulerOrder) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }
    /**
     * Sets the x, y, z angles and rotation order
     */
    set(x, y, z, order = this.order) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
        return this;
    }
    /**
     * Returns a new Euler with the same x, y, z, order values
     */
    clone() {
        return new Euler(this.x, this.y, this.z, this.order);
    }
    /**
     * Copies the values from another Euler
     */
    copy(euler) {
        this.x = euler.x;
        this.y = euler.y;
        this.z = euler.z;
        this.order = euler.order;
        return this;
    }
    /**
     * Reorders this Euler angles to a different order
     */
    reorder(newOrder) {
        // WARNING: this discards revolution information -bhouston
        // For simplicity, we don't implement full reordering here as it requires
        // converting to quaternion and back. Users should use setFromQuaternion
        // when it's implemented with Matrix4/Quaternion support.
        getMonitor().warn('Euler.reorder() requires Quaternion support for accurate conversion');
        this.order = newOrder;
        return this;
    }
    /**
     * Checks for strict equality with euler
     */
    equals(euler) {
        return euler.x === this.x && euler.y === this.y && euler.z === this.z && euler.order === this.order;
    }
    /**
     * Sets this Euler from an array
     */
    fromArray(array, offset = 0) {
        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];
        if (array[offset + 3] !== undefined)
            this.order = array[offset + 3];
        return this;
    }
    /**
     * Returns an array [x, y, z, order]
     */
    toArray(array = [], offset = 0) {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        array[offset + 3] = this.order;
        return array;
    }
    /**
     * Converts Euler angles to a [pitch, yaw, roll] array (common in aviation)
     * Note: This is just a convenience method that returns angles in a different naming convention
     */
    toPitchYawRoll() {
        // Convention mapping (order dependent):
        // For 'XYZ' order: X=pitch, Y=yaw, Z=roll
        // For 'YXZ' order: Y=yaw, X=pitch, Z=roll
        // etc.
        return {
            pitch: this.x,
            yaw: this.y,
            roll: this.z
        };
    }
    /**
     * Sets Euler angles from pitch, yaw, roll values
     */
    fromPitchYawRoll(pitch, yaw, roll, order = this.order) {
        return this.set(pitch, yaw, roll, order);
    }
    /**
     * Converts angles to degrees (returns new object with degree values)
     */
    toDegrees() {
        return {
            x: this.x * (180 / Math.PI),
            y: this.y * (180 / Math.PI),
            z: this.z * (180 / Math.PI),
            order: this.order
        };
    }
    /**
     * Sets from degree values
     */
    fromDegrees(x, y, z, order = this.order) {
        return this.set(x * (Math.PI / 180), y * (Math.PI / 180), z * (Math.PI / 180), order);
    }
    /**
     * Normalizes angles to the range [-π, π]
     */
    normalize() {
        const normalize = (angle) => {
            let result = angle % (2 * Math.PI);
            if (result > Math.PI)
                result -= 2 * Math.PI;
            if (result < -Math.PI)
                result += 2 * Math.PI;
            return result;
        };
        this.x = normalize(this.x);
        this.y = normalize(this.y);
        this.z = normalize(this.z);
        return this;
    }
    /**
     * Clamps each angle component between min and max
     */
    clamp(min, max) {
        this.x = Math.max(min, Math.min(max, this.x));
        this.y = Math.max(min, Math.min(max, this.y));
        this.z = Math.max(min, Math.min(max, this.z));
        return this;
    }
    /**
     * Negates all angle components
     */
    negate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }
    /**
     * Adds euler angles component-wise
     * Note: This is mathematically incorrect for general rotations but useful for incremental updates
     */
    add(euler) {
        this.x += euler.x;
        this.y += euler.y;
        this.z += euler.z;
        return this;
    }
    /**
     * Subtracts euler angles component-wise
     * Note: This is mathematically incorrect for general rotations but useful for incremental updates
     */
    sub(euler) {
        this.x -= euler.x;
        this.y -= euler.y;
        this.z -= euler.z;
        return this;
    }
    /**
     * Scales all angle components by a scalar
     */
    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    /**
     * Linearly interpolates between this Euler and target
     * Note: This is not a proper rotation interpolation (use Quaternion.slerp for that)
     * But it's useful for simple animations where gimbal lock is not an issue
     */
    lerp(target, alpha) {
        this.x += (target.x - this.x) * alpha;
        this.y += (target.y - this.y) * alpha;
        this.z += (target.z - this.z) * alpha;
        return this;
    }
    /**
     * Returns a string representation of this Euler
     */
    toString() {
        return `Euler(${this.x}, ${this.y}, ${this.z}, ${this.order})`;
    }
    // ===== METHODS REQUIRING ADDITIONAL THREE.JS CLASSES (COMMENTED OUT) =====
    /**
     * Sets this Euler from a rotation matrix
     * Assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
     */
    setFromRotationMatrix(m, order = this.order) {
        const te = m.elements;
        const m11 = te[0], m12 = te[4], m13 = te[8];
        const m21 = te[1], m22 = te[5], m23 = te[9];
        const m31 = te[2], m32 = te[6], m33 = te[10];
        switch (order) {
            case 'XYZ':
                this.y = Math.asin(clamp(m13, -1, 1));
                if (Math.abs(m13) < 0.9999999) {
                    this.x = Math.atan2(-m23, m33);
                    this.z = Math.atan2(-m12, m11);
                }
                else {
                    this.x = Math.atan2(m32, m22);
                    this.z = 0;
                }
                break;
            case 'YXZ':
                this.x = Math.asin(-clamp(m23, -1, 1));
                if (Math.abs(m23) < 0.9999999) {
                    this.y = Math.atan2(m13, m33);
                    this.z = Math.atan2(m21, m22);
                }
                else {
                    this.y = Math.atan2(-m31, m11);
                    this.z = 0;
                }
                break;
            case 'ZXY':
                this.x = Math.asin(clamp(m32, -1, 1));
                if (Math.abs(m32) < 0.9999999) {
                    this.y = Math.atan2(-m31, m33);
                    this.z = Math.atan2(-m12, m22);
                }
                else {
                    this.y = 0;
                    this.z = Math.atan2(m21, m11);
                }
                break;
            case 'ZYX':
                this.y = Math.asin(-clamp(m31, -1, 1));
                if (Math.abs(m31) < 0.9999999) {
                    this.x = Math.atan2(m32, m33);
                    this.z = Math.atan2(m21, m11);
                }
                else {
                    this.x = 0;
                    this.z = Math.atan2(-m12, m22);
                }
                break;
            case 'YZX':
                this.z = Math.asin(clamp(m21, -1, 1));
                if (Math.abs(m21) < 0.9999999) {
                    this.x = Math.atan2(-m23, m22);
                    this.y = Math.atan2(-m31, m11);
                }
                else {
                    this.x = 0;
                    this.y = Math.atan2(m13, m33);
                }
                break;
            case 'XZY':
                this.z = Math.asin(-clamp(m12, -1, 1));
                if (Math.abs(m12) < 0.9999999) {
                    this.x = Math.atan2(m32, m22);
                    this.y = Math.atan2(m13, m11);
                }
                else {
                    this.x = Math.atan2(-m23, m33);
                    this.y = 0;
                }
                break;
            default:
                getMonitor().warn('Euler: .setFromRotationMatrix() encountered an unknown order: ' + order);
        }
        this.order = order;
        return this;
    }
    /**
     * Sets this Euler from a Quaternion
     */
    setFromQuaternion(q, order) {
        // Lazy load Matrix4 to avoid circular dependency
        const _matrix = new Matrix4();
        _matrix.makeRotationFromQuaternion(q);
        return this.setFromRotationMatrix(_matrix, order);
    }
    /**
     * Sets this Euler from a Vector3 (just copies x, y, z values)
     */
    setFromVector3(v, order = this.order) {
        return this.set(v.x, v.y, v.z, order);
    }
    /**
     * Converts this Euler to a Vector3 (just extracts x, y, z)
     */
    toVector3(target) {
        if (target) {
            return target.set(this.x, this.y, this.z);
        }
        else {
            return new Vector3(this.x, this.y, this.z);
        }
    }
}
/**
 * Helper function to clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export { DefaultEulerOrder, Euler };
