const getNode = (core, nodeId) => {
    if (!nodeId) {
        throw new Error(`Getting node by null id`);
    }
    if (typeof nodeId === 'string') {
        const node = core.nodes.get(nodeId);
        if (!node) {
            throw new Error(`Node with ID ${nodeId} not found.`);
        }
        return node;
    }
    else {
        return nodeId;
    }
};

export { getNode as default };
