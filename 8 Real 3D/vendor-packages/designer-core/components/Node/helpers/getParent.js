import getNode from './getNode.js';

const getParent = (core, nodeId) => {
    const node = getNode(core, nodeId);
    return getNode(core, node.parent.get());
};

export { getParent as default };
