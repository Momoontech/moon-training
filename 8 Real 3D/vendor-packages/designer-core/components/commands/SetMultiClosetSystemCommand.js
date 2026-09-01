import getNode from '../Node/helpers/getNode.js';

/**
 * Assigns a multiCloset Item to a project-level system by writing the system's
 * UUID onto the closet's `system` `Value`. The `Value` is created on first
 * assignment (with the correct `nodeId` binding) when the closet was imported
 * without one — mirroring how `SetNodeAttributeValueCommand` auto-creates a
 * missing attribute. Undo restores the previous reference, or drops the freshly
 * created `Value` when there was none before.
 */
class SetMultiClosetSystemCommand {
    nodeId;
    systemId;
    prevValue = undefined;
    created = false;
    constructor(nodeId, systemId) {
        this.nodeId = nodeId;
        this.systemId = systemId;
    }
    execute(core) {
        const node = getNode(core, this.nodeId);
        this.prevValue = node.system ? node.system.get() : undefined;
        if (!node.system) {
            node.system = core.createValue(this.systemId, { nodeId: this.nodeId });
            this.created = true;
        }
        else {
            node.system.set(this.systemId);
        }
        return true;
    }
    undo(core) {
        const node = getNode(core, this.nodeId);
        if (this.created) {
            node.system = undefined;
            this.created = false;
            return true;
        }
        if (this.prevValue === undefined || !node.system)
            return false;
        node.system.set(this.prevValue);
        return true;
    }
}

export { SetMultiClosetSystemCommand as default };
