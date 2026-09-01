import { getMatrixWorld } from './getMatrixWorld.js';
import { Vector3 } from './math/Vector3.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

const getDraggedNodeOffset = (draggableNode, point) => {
    const matrixWorld = getMatrixWorld(draggableNode, false);
    return new Vector3().copy(point).applyMatrix4(matrixWorld.invert());
    // switch (hoveredNode.type) {
    //   case NodeType.MountPlane: {
    //     const plane = getNodePlane(hoveredNode);
    //     const matrixWorld = getMatrixWorld(draggableNode, false);
    //     const mountMatrixWorld = getMatrixWorld(hoveredNode, false);
    //     const offset = plane
    //       .projectPoint(point)
    //       .sub(plane.projectPoint(new Vector3().setFromMatrixPosition(matrixWorld)))
    //       .applyQuaternion(new Quaternion().setFromRotationMatrix(mountMatrixWorld.clone().invert()));
    //     console.log('MountPlane offset: ', point.toArray(), offset.toArray());
    //     return offset;
    //   }
    //   case NodeType.MountLine: {
    //     const line = getNodeLine(hoveredNode);
    //     const offset = line
    //       .closestPointToPoint(point)
    //       .sub(line.closestPointToPoint(new Vector3().setFromMatrixPosition(getMatrixWorld(draggableNode, false))))
    //       .applyQuaternion(new Quaternion().setFromRotationMatrix(getMatrixWorld(hoveredNode, false).invert()));
    //     console.log(
    //       'MountLine offset: ',
    //       point.toArray(),
    //       line.closestPointToPoint(point),
    //       line.closestPointToPoint(new Vector3().setFromMatrixPosition(getMatrixWorld(draggableNode, false))),
    //       line
    //         .closestPointToPoint(point)
    //         .sub(line.closestPointToPoint(new Vector3().setFromMatrixPosition(getMatrixWorld(draggableNode, false)))),
    //       offset.toArray()
    //     );
    //     return offset.set(0, 0, 0);
    //   }
    //   default:
    //     return new Vector3();
    // }
};

export { getDraggedNodeOffset };
