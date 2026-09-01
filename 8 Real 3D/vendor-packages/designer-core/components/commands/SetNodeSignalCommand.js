import getNode from '../Node/helpers/getNode.js';

class SetNodeSignalCommand {
    nodeId;
    propertyName;
    propertyValue;
    prevValue = undefined;
    constructor(nodeId, propertyName, propertyValue) {
        this.nodeId = nodeId;
        this.propertyName = propertyName;
        this.propertyValue = propertyValue;
    }
    execute(core) {
        const node = getNode(core, this.nodeId);
        if (!(this.propertyName in node) || !('get' in node[this.propertyName]))
            return false;
        this.prevValue = node[this.propertyName].get();
        node[this.propertyName].set(this.propertyValue);
        return true;
    }
    undo(core) {
        if (this.prevValue === undefined)
            return false;
        const node = getNode(core, this.nodeId);
        if (!(this.propertyName in node) || !('set' in node[this.propertyName]))
            return false;
        node[this.propertyName].set(this.prevValue);
        return true;
    }
}

export { SetNodeSignalCommand as default };
