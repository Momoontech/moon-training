/**
 * Custom Quaternion class to replace Three.js Quaternion
 * Implements quaternion math for 3D rotations
 * Format: x, y, z, w where w is the real part
 */
class Quaternion {
    x;
    y;
    z;
    w;
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    /**
     * Sets the x, y, z, w components of this quaternion
     */
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }
    /**
     * Returns a new Quaternion with the same x, y, z, w values
     */
    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }
    /**
     * Copies the values from another Quaternion
     */
    copy(quaternion) {
        this.x = quaternion.x;
        this.y = quaternion.y;
        this.z = quaternion.z;
        this.w = quaternion.w;
        return this;
    }
    /**
     * Sets this quaternion from axis and angle
     * Assumes axis is normalized
     */
    setFromAxisAngle(axis, angle) {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(halfAngle);
        return this;
    }
    /**
     * Sets this quaternion from rotation specified by unit vectors
     */
    setFromUnitVectors(vFrom, vTo) {
        // assumes direction vectors vFrom and vTo are normalized
        let r = vFrom.dot(vTo) + 1;
        if (r < Number.EPSILON) {
            // vFrom and vTo point in opposite directions
            r = 0;
            if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
                this.x = -vFrom.y;
                this.y = vFrom.x;
                this.z = 0;
                this.w = r;
            }
            else {
                this.x = 0;
                this.y = -vFrom.z;
                this.z = vFrom.y;
                this.w = r;
            }
        }
        else {
            // crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3
            this.x = vFrom.y * vTo.z - vFrom.z * vTo.y;
            this.y = vFrom.z * vTo.x - vFrom.x * vTo.z;
            this.z = vFrom.x * vTo.y - vFrom.y * vTo.x;
            this.w = r;
        }
        return this.normalize();
    }
    /**
     * Computes the angle between this quaternion and q in radians
     */
    angleTo(q) {
        return 2 * Math.acos(Math.abs(Math.max(-1, Math.min(1, this.dot(q)))));
    }
    /**
     * Rotates this quaternion by a given angular step to q
     */
    rotateTowards(q, step) {
        const angle = this.angleTo(q);
        if (angle === 0)
            return this;
        const t = Math.min(1, step / angle);
        this.slerp(q, t);
        return this;
    }
    /**
     * Sets this quaternion to the identity quaternion
     */
    identity() {
        return this.set(0, 0, 0, 1);
    }
    /**
     * Inverts this quaternion
     */
    invert() {
        return this.conjugate();
    }
    /**
     * Conjugates this quaternion
     */
    conjugate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }
    /**
     * Computes the dot product with q
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }
    /**
     * Computes the squared length of this quaternion
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }
    /**
     * Computes the length of this quaternion
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
    /**
     * Normalizes this quaternion (makes it unit length)
     */
    normalize() {
        let l = this.length();
        if (l === 0) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        }
        else {
            l = 1 / l;
            this.x = this.x * l;
            this.y = this.y * l;
            this.z = this.z * l;
            this.w = this.w * l;
        }
        return this;
    }
    /**
     * Multiplies this quaternion by q
     */
    multiply(q) {
        return this.multiplyQuaternions(this, q);
    }
    /**
     * Multiplies q by this quaternion
     */
    premultiply(q) {
        return this.multiplyQuaternions(q, this);
    }
    /**
     * Sets this quaternion to a * b
     */
    multiplyQuaternions(a, b) {
        // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
        const qax = a.x;
        const qay = a.y;
        const qaz = a.z;
        const qaw = a.w;
        const qbx = b.x;
        const qby = b.y;
        const qbz = b.z;
        const qbw = b.w;
        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
        return this;
    }
    /**
     * Spherical linear interpolation between this quaternion and q
     */
    slerp(qb, t) {
        if (t === 0)
            return this;
        if (t === 1)
            return this.copy(qb);
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;
        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
        let cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;
        if (cosHalfTheta < 0) {
            this.w = -qb.w;
            this.x = -qb.x;
            this.y = -qb.y;
            this.z = -qb.z;
            cosHalfTheta = -cosHalfTheta;
        }
        else {
            this.copy(qb);
        }
        if (cosHalfTheta >= 1.0) {
            this.w = w;
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }
        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;
        if (sqrSinHalfTheta <= Number.EPSILON) {
            const s = 1 - t;
            this.w = s * w + t * this.w;
            this.x = s * x + t * this.x;
            this.y = s * y + t * this.y;
            this.z = s * z + t * this.z;
            this.normalize();
            return this;
        }
        const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
        this.w = w * ratioA + this.w * ratioB;
        this.x = x * ratioA + this.x * ratioB;
        this.y = y * ratioA + this.y * ratioB;
        this.z = z * ratioA + this.z * ratioB;
        return this;
    }
    /**
     * Sets this quaternion to the slerp result of qa and qb
     */
    slerpQuaternions(qa, qb, t) {
        return this.copy(qa).slerp(qb, t);
    }
    /**
     * Performs a random quaternion generation
     */
    random() {
        // Derived from http://planning.cs.uiuc.edu/node198.html
        // Note: this method is designed to generate a uniform random rotation
        const u1 = Math.random();
        const sqrt1u1 = Math.sqrt(1 - u1);
        const sqrtu1 = Math.sqrt(u1);
        const u2 = 2 * Math.PI * Math.random();
        const u3 = 2 * Math.PI * Math.random();
        return this.set(sqrt1u1 * Math.sin(u2), sqrt1u1 * Math.cos(u2), sqrtu1 * Math.sin(u3), sqrtu1 * Math.cos(u3));
    }
    /**
     * Checks for strict equality with q
     */
    equals(quaternion) {
        return quaternion.x === this.x && quaternion.y === this.y && quaternion.z === this.z && quaternion.w === this.w;
    }
    /**
     * Sets this quaternion from an array
     */
    fromArray(array, offset = 0) {
        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];
        this.w = array[offset + 3];
        return this;
    }
    /**
     * Returns an array [x, y, z, w]
     */
    toArray(array = [], offset = 0) {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        array[offset + 3] = this.w;
        return array;
    }
    /**
     * Sets components from a BufferAttribute
     */
    fromBufferAttribute(attribute, index) {
        this.x = attribute.getX(index);
        this.y = attribute.getY(index);
        this.z = attribute.getZ(index);
        this.w = attribute.getW(index);
        return this;
    }
    /**
     * Converts quaternion to [axis, angle] representation
     */
    toAxisAngle(targetAxis) {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm
        // q has to be normalized
        if (this.w > 1)
            this.normalize();
        const angle = 2 * Math.acos(this.w);
        const s = Math.sqrt(1 - this.w * this.w);
        const axis = targetAxis;
        if (s < 0.001) {
            // test to avoid divide by zero, s is always positive due to sqrt
            // if s close to zero then direction of axis not important
            axis.x = this.x;
            axis.y = this.y;
            axis.z = this.z;
        }
        else {
            axis.x = this.x / s;
            axis.y = this.y / s;
            axis.z = this.z / s;
        }
        return { axis, angle };
    }
    // ===== METHODS REQUIRING ADDITIONAL THREE.JS CLASSES (COMMENTED OUT) =====
    /**
     * Sets this quaternion from Euler angles
     */
    setFromEuler(euler) {
        const x = euler.x, y = euler.y, z = euler.z, order = euler.order;
        // http://www.mathworks.com/matlabcentral/fileexchange/
        // 20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
        // content/SpinCalc.m
        const cos = Math.cos;
        const sin = Math.sin;
        const c1 = cos(x / 2);
        const c2 = cos(y / 2);
        const c3 = cos(z / 2);
        const s1 = sin(x / 2);
        const s2 = sin(y / 2);
        const s3 = sin(z / 2);
        switch (order) {
            case 'XYZ':
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
                break;
            case 'YXZ':
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
                break;
            case 'ZXY':
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
                break;
            case 'ZYX':
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
                break;
            case 'YZX':
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
                break;
            case 'XZY':
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
                break;
        }
        return this;
    }
    /**
     * Sets this quaternion from a rotation matrix
     * Assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
     */
    setFromRotationMatrix(m) {
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
        const te = m.elements;
        const m11 = te[0], m12 = te[4], m13 = te[8];
        const m21 = te[1], m22 = te[5], m23 = te[9];
        const m31 = te[2], m32 = te[6], m33 = te[10];
        const trace = m11 + m22 + m33;
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            this.w = 0.25 / s;
            this.x = (m32 - m23) * s;
            this.y = (m13 - m31) * s;
            this.z = (m21 - m12) * s;
        }
        else if (m11 > m22 && m11 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            this.w = (m32 - m23) / s;
            this.x = 0.25 * s;
            this.y = (m12 + m21) / s;
            this.z = (m13 + m31) / s;
        }
        else if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            this.w = (m13 - m31) / s;
            this.x = (m12 + m21) / s;
            this.y = 0.25 * s;
            this.z = (m23 + m32) / s;
        }
        else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            this.w = (m21 - m12) / s;
            this.x = (m13 + m31) / s;
            this.y = (m23 + m32) / s;
            this.z = 0.25 * s;
        }
        return this;
    }
}

export { Quaternion };
