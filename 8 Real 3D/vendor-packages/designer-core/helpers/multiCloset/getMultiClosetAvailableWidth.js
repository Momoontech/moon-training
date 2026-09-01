import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import { MultiClosetsJointType } from '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getItem from '../../components/Node/helpers/getItem.js';
import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import getAttributeValue from '../getAttributeValue.js';
import getPropertyValue from '../getPropertyValue.js';

/**
 * Inside width of a multiCloset that is actually available for sections /
 * separators — `size.x` minus the space reserved on each side that abuts a
 * neighbor closet. This mirrors the `availableSize` computation in
 * `updateMultiClosetItemLayoutEffect` exactly so the calculator and the live
 * layout agree on usable width:
 *
 *  - "bridge"       gap  ← side neighbor jointed back to us with a `bridge` joint
 *  - "corner joint" gap  ← joint neighbor on a side with a corner joint type
 *
 * Both can be present on the same side, so they sum. Missing attribute => 0.
 */
const getMultiClosetAvailableWidth = (core, itemId) => {
    const item = getItem(core, itemId);
    const overallSize = item.size.x.get();
    const leftNeighborId = getPropertyValue(item, 'LeftMultiClosetNeighborId');
    const leftNeighborNode = leftNeighborId ? getOptionalNode(core, leftNeighborId) : undefined;
    const leftNeighborRightJoint = leftNeighborNode
        ? getPropertyValue(leftNeighborNode, 'RightJointMultiClosetNeighborId')
        : undefined;
    const leftNeighborRightJointType = leftNeighborNode
        ? getAttributeValue(leftNeighborNode, 'RightJointType')
        : undefined;
    const rightNeighborId = getPropertyValue(item, 'RightMultiClosetNeighborId');
    const rightNeighborNode = rightNeighborId ? getOptionalNode(core, rightNeighborId) : undefined;
    const rightNeighborLeftJoint = rightNeighborNode
        ? getPropertyValue(rightNeighborNode, 'LeftJointMultiClosetNeighborId')
        : undefined;
    const rightNeighborLeftJointType = rightNeighborNode
        ? getAttributeValue(rightNeighborNode, 'LeftJointType')
        : undefined;
    const hasLeftJointNeighbor = !!getPropertyValue(item, 'LeftJointMultiClosetNeighborId');
    const hasRightJointNeighbor = !!getPropertyValue(item, 'RightJointMultiClosetNeighborId');
    const leftJointType = getAttributeValue(item, 'LeftJointType');
    const rightJointType = getAttributeValue(item, 'RightJointType');
    const leftBridge = leftNeighborRightJoint && leftNeighborRightJointType === MultiClosetsJointType.bridge
        ? getAttributeValue(item, 'LeftBridgeWidth')
        : 0;
    const rightBridge = rightNeighborLeftJoint && rightNeighborLeftJointType === MultiClosetsJointType.bridge
        ? getAttributeValue(item, 'RightBridgeWidth')
        : 0;
    const leftCornerJoint = hasLeftJointNeighbor &&
        (leftJointType === MultiClosetsJointType.cornerCorner || leftJointType === MultiClosetsJointType.cornerDiagonal)
        ? getAttributeValue(item, 'LeftCornerJointWidth')
        : 0;
    const rightCornerJoint = hasRightJointNeighbor &&
        (rightJointType === MultiClosetsJointType.cornerCorner || rightJointType === MultiClosetsJointType.cornerDiagonal)
        ? getAttributeValue(item, 'RightCornerJointWidth')
        : 0;
    const leftReserved = leftBridge + leftCornerJoint;
    const rightReserved = rightBridge + rightCornerJoint;
    return overallSize - leftReserved - rightReserved;
};

export { getMultiClosetAvailableWidth as default, getMultiClosetAvailableWidth };
