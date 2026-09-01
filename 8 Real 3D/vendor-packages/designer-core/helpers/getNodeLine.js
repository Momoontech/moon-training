import { getMatrixWorld } from './getMatrixWorld.js';
import { getMountLineWidth } from './getMountLineWidth.js';
import { p, q, s } from './getNodePlane.js';
import { Vector3 } from './math/Vector3.js';
import { Line3 } from './math/Line3.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

const getNodeLine = (node) => {
    const matrix = getMatrixWorld(node, false);
    matrix.decompose(p, q, s);
    const size = getMountLineWidth(node);
    return new Line3().set(p, p.clone().add(new Vector3(size, 0, 0).applyQuaternion(q)));
};

export { getNodeLine };
