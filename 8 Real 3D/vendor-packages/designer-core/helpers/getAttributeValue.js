const getAttributeValue = (node, attributeName) => {
    let attributeValue = node.attributes.get(attributeName);
    if (attributeValue === undefined) {
        // Asking for an attribute the node does not (yet) have is a valid case.
        // Returning a bare `0` here would make the reading formula/effect track no
        // dependency for this attribute, so it would never re-evaluate once the
        // attribute is later added. Instead we materialize a default `Value` on the
        // node now: reading it below subscribes the caller's computed to its signal,
        // and SetNodeAttributeValueCommand reuses + `.set()`s this same instance
        // (it only creates a new Value when none exists), so the change propagates
        // reactively. `node.attributes` is an open-ended map by design, so seeding
        // a referenced-but-absent key here is consistent with how the command fills
        // it in. (Properties are deliberately not handled this way — that map is
        // closed and always pre-seeded; see getPropertyValue.)
        attributeValue = node.core.createValue(0, { nodeId: node.id });
        node.attributes.set(attributeName, attributeValue);
    }
    const value = attributeValue.get();
    return (typeof value === 'number' && isNaN(value)) || value === undefined ? 0 : value;
};

export { getAttributeValue as default };
