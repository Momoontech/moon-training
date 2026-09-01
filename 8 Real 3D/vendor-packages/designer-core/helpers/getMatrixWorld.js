import getNode from '../components/Node/helpers/getNode.js';
import getPoint from '../components/Node/helpers/getPoint.js';
import getRoom from '../components/Node/helpers/getRoom.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import { getCeilingLocalTransform } from './getCeilingLocalTransform.js';
import { Vector3 } from './math/Vector3.js';
import { Euler } from './math/Euler.js';
import { Matrix4 } from './math/Matrix4.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';
import { Quaternion } from './math/Quaternion.js';

const p = new Vector3();
const r = new Euler();
const q = new Quaternion();
const s = new Vector3(1, 1, 1);
// Reused by getMatrix — never allocated inside the loop
const _nodeM4 = new Matrix4();
const getRoomSegmentPosition = (node) => {
    const { core, from, to } = node;
    const fromNode = getPoint(core, from.get());
    const toNode = getPoint(core, to.get());
    const fromX = fromNode.position.x.get();
    const fromY = fromNode.position.y.getTransformed();
    const toX = toNode.position.x.get();
    const toY = toNode.position.y.getTransformed();
    const angle = Math.atan2(toY - fromY, toX - fromX);
    return { position: { x: fromX, y: fromY, z: 0 }, rotation: { x: Math.PI / 2, y: angle, z: 0 } };
};
const getMatrix = (node) => {
    s.x = 1;
    s.y = 1;
    s.z = 1;
    if (node.type === NodeType.RoomSegment) {
        const { position, rotation } = getRoomSegmentPosition(node);
        p.x = position.x;
        p.y = position.y;
        p.z = position.z;
        r.x = rotation.x;
        r.y = rotation.y;
        r.z = rotation.z;
    }
    else if (node.type === NodeType.Floorplan) {
        p.x = 0;
        p.y = 0;
        p.z = 0;
        r.x = -Math.PI / 2;
        r.y = 0;
        r.z = 0;
    }
    else if (node.type === NodeType.Ceiling2D) {
        const room = getRoom(node.core, node.parent.get());
        const { position, rotation } = getCeilingLocalTransform(room);
        p.x = position.x;
        p.y = position.y;
        p.z = position.z;
        r.x = rotation.x;
        r.y = rotation.y;
        r.z = rotation.z;
    }
    else {
        if ('position' in node && 'z' in node.position) {
            p.x = node.position.x.get();
            p.y = node.position.y.get();
            p.z = node.position.z.get();
        }
        else {
            p.x = 0;
            p.y = 0;
            p.z = 0;
        }
        if ('rotation' in node) {
            r.x = node.rotation.x.get();
            r.y = node.rotation.y.get();
            r.z = node.rotation.z.get();
        }
        else {
            r.x = 0;
            r.y = 0;
            r.z = 0;
        }
    }
    return _nodeM4.compose(p, q.setFromEuler(r), s);
};
/**
 * Computes the world-space matrix for a node by multiplying up the parent chain.
 *
 * When `out` is supplied the result is written directly into it (no allocation).
 * When omitted a fresh `Matrix4` is allocated for backward compatibility.
 */
const getMatrixWorld = (node, scale = false, out) => {
    let result = out ?? new Matrix4();
    let parent = node;
    getMatrix(parent).decompose(p, q, s);
    if (scale && 'size' in node && node.size && 'z' in node.size) {
        s.x = node.size.x.get();
        s.y = node.size.y.get();
        s.z = node.size.z.get();
    }
    else {
        s.x = 1;
        s.y = 1;
        s.z = 1;
    }
    result.compose(p, q, s);
    while (true) {
        if (!parent.parent.get())
            break;
        parent = getNode(parent.core, parent.parent.get());
        result.premultiply(getMatrix(parent));
    }
    return result;
};

export { getMatrixWorld, getRoomSegmentPosition };
