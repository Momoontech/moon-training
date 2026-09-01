import { getMatrixWorld } from '../../../helpers/getMatrixWorld.js';
import { Vector3 } from '../../../helpers/math/Vector3.js';
import { RAD2DEG } from '../../../helpers/math/constants.js';
import { Euler } from '../../../helpers/math/Euler.js';
import { Matrix4 } from '../../../helpers/math/Matrix4.js';
import '../../../helpers/math/plane/unitBoxCorners.js';
import '../../../helpers/math/plane/projectUnitBoxToFootprint2D.js';
import { calculateValue } from '../../Value/calculate.js';
import defaultHoleCurve from './defaultHoleCurve.js';

// Both `getMatrixWorld` calls below pass `scale = false`, so the resulting
// matrices carry only rotation + translation. The relative matrix is therefore
// a rigid transform and we never have to reason about scale here.
const _wallWorld = new Matrix4();
const _nodeWorld = new Matrix4();
const _wallToNode = new Matrix4();
const _scratchPoint = new Vector3();
const _euler = new Euler();
const transformPoint = (point, x, y) => {
    _scratchPoint.set(x, y, 0).applyMatrix4(_wallToNode);
    point.x = _scratchPoint.x;
    point.y = _scratchPoint.y;
};
const calculateHoleCurve = (node, wall2D) => {
    const { id, core } = node;
    const options = { nodeId: id };
    const { holeShape } = node;
    const result = JSON.parse(JSON.stringify(holeShape ? holeShape.get() : defaultHoleCurve));
    // Hole points are authored in the node's local 2D frame; `Wall2D.holes`
    // stores them in the wall's local 2D frame. Map node-local → wall-local via
    //   M = inverse(M_wall_world) * M_node_world
    // which collapses to the chain of transforms strictly between `node` and
    // `wall2D` (everything from `wall2D` upward cancels). This works whether
    // `node` is a direct grandchild of `wall2D` (Wall2D → MountPlane → Item)
    // or sits deeper in the tree.
    getMatrixWorld(wall2D, false, _wallWorld);
    getMatrixWorld(node, false, _nodeWorld);
    _wallToNode.copy(_wallWorld).invert().multiply(_nodeWorld);
    // The only rotation between an item and its parent Wall2D that preserves
    // the planar shape of an arc is rotation around the wall normal (local Z).
    // Extract that single in-plane angle to rotate arc parameters consistently.
    // Note the unit mismatch baked into the curve format: `startAngle` /
    // `endAngle` are stored in degrees (calculateCurvePoint applies DEG2RAD
    // before handing them to three.js), while `rotation` is stored in radians.
    _euler.setFromRotationMatrix(_wallToNode, 'XYZ');
    const inPlaneAngleRad = _euler.z;
    const inPlaneAngleDeg = inPlaneAngleRad * RAD2DEG;
    for (let i = 0; i < result.length; i++) {
        const point = result[i];
        switch (point.type) {
            case undefined:
            case 'moveTo':
            case 'lineTo':
                transformPoint(point, calculateValue(point.x, core, options), calculateValue(point.y, core, options));
                break;
            case 'arcTo':
                transformPoint(point.center, calculateValue(point.center.x, core, options), calculateValue(point.center.y, core, options));
                point.radius = calculateValue(point.radius, core, options);
                if (point.radiusY) {
                    point.radiusY = calculateValue(point.radiusY, core, options);
                }
                if (point.rotation || inPlaneAngleRad !== 0) {
                    point.rotation =
                        (point.rotation ? calculateValue(point.rotation, core, options) : 0) + inPlaneAngleRad;
                }
                point.startAngle = calculateValue(point.startAngle, core, options) + inPlaneAngleDeg;
                point.endAngle = calculateValue(point.endAngle, core, options) + inPlaneAngleDeg;
                break;
            case 'bezierCurveTo':
                transformPoint(point.controlPoint1, calculateValue(point.controlPoint1.x, core, options), calculateValue(point.controlPoint1.y, core, options));
                transformPoint(point, calculateValue(point.x, core, options), calculateValue(point.y, core, options));
                break;
        }
    }
    return result;
};

export { calculateHoleCurve as default };
