import getOptionalNode from '../components/Node/helpers/getOptionalNode.js';
import getParentItem from '../components/Node/helpers/getParentItem.js';
import getPropertyValue from './getPropertyValue.js';

const getMultiClosetNeighborSize = (core, nodeId, side, axis) => {
    if (!nodeId)
        throw new Error('getMultiClosetNeighborSize called with undefined nodeId');
    const closet = getParentItem(core, nodeId);
    const neighborItemId = getPropertyValue(closet, `${side}MultiClosetNeighborId`);
    if (!neighborItemId)
        return 0;
    const neighbor = getOptionalNode(core, neighborItemId);
    if (!neighbor)
        return 0;
    return neighbor.size[axis].get();
};

export { getMultiClosetNeighborSize as default };
