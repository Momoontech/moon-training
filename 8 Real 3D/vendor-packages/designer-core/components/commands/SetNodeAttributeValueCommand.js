import getNode from '../Node/helpers/getNode.js';

class SetNodeAttributeValueCommand {
    attributeName; // @TODO: handle attribute names fully selectively
    prevAttrValue = undefined;
    newAttrValue;
    nodeId;
    constructor(nodeId, attributeName, newValue) {
        this.nodeId = nodeId;
        this.attributeName = attributeName;
        this.newAttrValue = newValue;
    }
    execute(core) {
        const node = getNode(core, this.nodeId);
        let attribute = node.attributes.get(this.attributeName);
        this.prevAttrValue = attribute ? attribute.get() : undefined;
        if (!attribute) {
            node.attributes.set(this.attributeName, core.createValue(this.newAttrValue, { nodeId: this.nodeId }));
        }
        attribute = node.attributes.get(this.attributeName);
        if (!attribute)
            return false;
        attribute.set(this.newAttrValue);
        return true;
    }
    undo(core) {
        const node = getNode(core, this.nodeId);
        let attribute = node.attributes.get(this.attributeName);
        if (!attribute)
            return false;
        if (this.prevAttrValue !== undefined) {
            attribute.set(this.prevAttrValue);
        }
        else {
            node.attributes.delete(this.attributeName);
        }
        return true;
    }
}

export { SetNodeAttributeValueCommand as default };
