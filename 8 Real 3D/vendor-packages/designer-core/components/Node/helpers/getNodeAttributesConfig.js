const getNodeAttributesConfig = (node) => {
    const nodeAttributes = {};
    const entries = node.attributes.entries();
    for (const [key, value] of entries) {
        nodeAttributes[key] = value.getSignal();
    }
    return nodeAttributes;
};

export { getNodeAttributesConfig };
