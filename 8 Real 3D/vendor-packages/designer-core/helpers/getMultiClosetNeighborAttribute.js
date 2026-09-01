import getOptionalNode from '../components/Node/helpers/getOptionalNode.js';
import getParentItem from '../components/Node/helpers/getParentItem.js';
import getAttributeValue from './getAttributeValue.js';
import getPropertyValue from './getPropertyValue.js';

const getMultiClosetNeighborAttribute = (core, nodeId, side, attributeName) => {
    if (!nodeId)
        throw new Error('getMultiClosetNeighborAttribute called with undefined nodeId');
    const closet = getParentItem(core, nodeId);
    const neighborItemId = getPropertyValue(closet, `${side}MultiClosetNeighborId`);
    if (!neighborItemId)
        return 0;
    const neighbor = getOptionalNode(core, neighborItemId);
    if (!neighbor)
        return 0;
    return getAttributeValue(neighbor, attributeName);
};

export { getMultiClosetNeighborAttribute as default };
