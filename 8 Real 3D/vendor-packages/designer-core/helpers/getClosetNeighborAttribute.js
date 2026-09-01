import getNode from '../components/Node/helpers/getNode.js';
import getParentItem from '../components/Node/helpers/getParentItem.js';
import getAttributeValue from './getAttributeValue.js';

const getClosetNeighborAttribute = (core, nodeId, side, attributeName) => {
    if (!nodeId)
        throw new Error('getClosetNeighborAttribute called with undefined nodeId');
    const closet = getParentItem(core, nodeId);
    const neighborItemId = getAttributeValue(closet, `${side}ClosetId`);
    if (!neighborItemId)
        return 0;
    const neighbor = getNode(core, neighborItemId);
    return getAttributeValue(neighbor, attributeName);
};

export { getClosetNeighborAttribute as default };
