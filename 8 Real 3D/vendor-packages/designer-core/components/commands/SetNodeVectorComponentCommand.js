import { setVectorProperty } from '../helpers/setVectorProperty.js';
import getNode from '../Node/helpers/getNode.js';

class SetNodeVectorComponentCommand {
    nodeId;
    axe;
    vector;
    prevValue = undefined;
    newValue;
    constructor(nodeId, vector, axis, newValue) {
        this.nodeId = nodeId;
        this.vector = vector;
        this.axe = axis;
        this.newValue = newValue;
    }
    execute(core) {
        const node = getNode(core, this.nodeId);
        if (!(`${this.vector}` in node))
            return false;
        if (!(`${this.axe}` in node[this.vector]))
            return false;
        this.prevValue = node[this.vector][this.axe].getSignal();
        setVectorProperty(node, this.vector, this.axe, this.newValue);
        return true;
    }
    undo(core) {
        const node = getNode(core, this.nodeId);
        if (!(`${this.vector}` in node))
            return false;
        if (!(`${this.axe}` in node[this.vector]))
            return false;
        if (!this.prevValue)
            return false;
        setVectorProperty(node, this.vector, this.axe, this.prevValue);
        return true;
    }
}

export { SetNodeVectorComponentCommand as default };
