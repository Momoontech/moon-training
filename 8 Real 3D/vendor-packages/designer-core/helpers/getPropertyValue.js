import { getMonitor } from './monitor.js';

const getPropertyValue = (node, propertyName) => {
    if ('properties' in node === false) {
        getMonitor().warn('No properties on node: ', node);
        return 0;
    }
    const properties = node.properties;
    let propertyValue = properties.get(propertyName);
    if (!propertyValue) {
        // Asking for a property the node does not (yet) have is a valid case.
        // Returning a bare `0` here would make the reading formula/effect track no
        // dependency for this property, so it would never re-evaluate once the
        // property is later set. Instead we materialize a default `Value` on the
        // node now: reading it below subscribes the caller's computed to its signal,
        // and because the entry now exists, SetNodePropertyValueCommand reuses +
        // `.set()`s this same instance (its `if (!property) return false` guard no
        // longer trips), so the change propagates reactively. Mirrors getAttributeValue.
        propertyValue = node.core.createValue(0, { nodeId: node.id });
        properties.set(propertyName, propertyValue);
    }
    const value = propertyValue.get();
    return (typeof value === 'number' && isNaN(value)) || value === undefined ? 0 : value;
};

export { getPropertyValue as default };
