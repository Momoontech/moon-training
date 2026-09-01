const getOptionalNode = (core, nodeId) => {
    if (!nodeId) {
        return undefined;
    }
    const node = core.nodes.get(nodeId);
    if (!node) {
        return undefined;
    }
    return node;
};

export { getOptionalNode as default };
