import { getMatrixWorld } from './getMatrixWorld.js';
import { Vector3 } from './math/Vector3.js';
import { Plane } from './math/Plane.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';
import { Quaternion } from './math/Quaternion.js';

const p = new Vector3();
const q = new Quaternion();
const s = new Vector3(1, 1, 1);
const normal = new Vector3(0, 0, 1);
const getNodePlane = (node) => {
    const matrix = getMatrixWorld(node, false);
    matrix.decompose(p, q, s);
    return new Plane().setFromNormalAndCoplanarPoint(normal.set(0, 0, 1).applyQuaternion(q), p);
};

export { getNodePlane, p, q, s };
