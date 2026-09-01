import getOptionalNode from '../components/Node/helpers/getOptionalNode.js';
import getParentItem from '../components/Node/helpers/getParentItem.js';
import getPropertyValue from './getPropertyValue.js';

const getMultiClosetNeighborProperty = (core, nodeId, side, propertyName) => {
    if (!nodeId)
        throw new Error('getMultiClosetNeighborProperty called with undefined nodeId');
    const closet = getParentItem(core, nodeId);
    const neighborItemId = getPropertyValue(closet, `${side}MultiClosetNeighborId`);
    if (!neighborItemId)
        return 0;
    const neighbor = getOptionalNode(core, neighborItemId);
    if (!neighbor)
        return 0;
    return getPropertyValue(neighbor, propertyName);
};

export { getMultiClosetNeighborProperty as default };
