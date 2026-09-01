import { Vector3 } from '../math/Vector3.js';
import { Euler } from '../math/Euler.js';
import { Matrix4 } from '../math/Matrix4.js';
import '../math/plane/unitBoxCorners.js';
import '../math/plane/projectUnitBoxToFootprint2D.js';

const _u = new Vector3();
const _v = new Vector3();
const _n = new Vector3();
const _edge1 = new Vector3();
const _edge2 = new Vector3();
const _origin = new Vector3();
const _vert = new Vector3();
const _basis = new Matrix4();
const _euler = new Euler();
/**
 * Picks two edges of the polygon whose cross product is non-degenerate.
 * Returns indices `(j, k)` such that `(polygon[j] - polygon[0])` and
 * `(polygon[k] - polygon[0])` span the facet plane.
 *
 * Returns `null` if the polygon is degenerate (collinear or has < 3
 * distinct vertices).
 */
const findSpanningEdges = (polygon) => {
    for (let j = 1; j < polygon.length; j += 1) {
        _edge1.set(polygon[j].x - polygon[0].x, polygon[j].y - polygon[0].y, polygon[j].z - polygon[0].z);
        if (_edge1.lengthSq() < 1e-18)
            continue;
        for (let k = j + 1; k < polygon.length; k += 1) {
            _edge2.set(polygon[k].x - polygon[0].x, polygon[k].y - polygon[0].y, polygon[k].z - polygon[0].z);
            if (_edge2.lengthSq() < 1e-18)
                continue;
            // Cross magnitude squared = |e1|^2 |e2|^2 - (e1·e2)^2; non-zero iff non-collinear.
            const dot = _edge1.dot(_edge2);
            const cross2 = _edge1.lengthSq() * _edge2.lengthSq() - dot * dot;
            if (cross2 > 1e-18)
                return { j, k };
        }
    }
    return null;
};
/**
 * Computes the local pose and projected outline for a single cathedral
 * facet. Pure-math: no signal reads, no Three.js scene state, safe to call
 * from both reactive effects and per-frame drag/hit-test code.
 */
const computeFacetMountPose = (facet) => {
    const polygon = facet.polygon;
    if (polygon.length < 3)
        return null;
    const spans = findSpanningEdges(polygon);
    if (!spans)
        return null;
    const p0 = polygon[0];
    const pj = polygon[spans.j];
    const pk = polygon[spans.k];
    // Build orthonormal basis (u, v, n) where n is the downward-into-room normal.
    _edge1.set(pj.x - p0.x, pj.y - p0.y, pj.z - p0.z);
    _edge2.set(pk.x - p0.x, pk.y - p0.y, pk.z - p0.z);
    _u.copy(_edge1).normalize();
    _n.copy(_edge1).cross(_edge2).normalize();
    // Flip so the normal faces DOWN into the room.
    if (_n.z > 0)
        _n.multiplyScalar(-1);
    _v.copy(_n).cross(_u).normalize();
    // makeBasis fills columns: M = [u | v | n], so M * (1,0,0) = u, etc.
    // This is exactly the rotation that maps local (0,0,1) -> n, which is what
    // `getNodePlane` consumes for the surface normal.
    _basis.makeBasis(_u, _v, _n);
    _euler.setFromRotationMatrix(_basis);
    // Project each vertex into the MountPlane's local 2D frame:
    //   local = R^T * (worldVertex - origin)
    // R^T columns are (u, v, n), so local.x = u·d, local.y = v·d, local.z ≈ 0.
    _origin.set(p0.x, p0.y, p0.z);
    const polygon2D = polygon.map((p) => {
        _vert.set(p.x - _origin.x, p.y - _origin.y, p.z - _origin.z);
        return { x: _vert.dot(_u), y: _vert.dot(_v) };
    });
    return {
        position: { x: p0.x, y: p0.y, z: p0.z },
        rotation: { x: _euler.x, y: _euler.y, z: _euler.z },
        polygon2D
    };
};

export { computeFacetMountPose };
