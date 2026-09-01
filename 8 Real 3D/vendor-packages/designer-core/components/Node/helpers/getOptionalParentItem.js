import getParentItem from './getParentItem.js';

const getOptionalParentItem = (core, nodeId) => {
    try {
        return getParentItem(core, nodeId);
    }
    catch {
        return undefined;
    }
};

export { getOptionalParentItem as default };
