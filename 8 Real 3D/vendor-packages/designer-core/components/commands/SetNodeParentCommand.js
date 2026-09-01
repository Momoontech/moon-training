import { resolveParentChildProperty } from '../../helpers/resolveParentChildProperty.js';
import setParent from '../helpers/setParent.js';
import getNode from '../Node/helpers/getNode.js';

class SetNodeParentCommand {
    nodeId;
    prevParentId = null;
    newParentId;
    childProperty;
    prevChildProperty = 'children';
    /** Index in `prevChildProperty` before execute; used on undo to restore order. */
    prevIndex;
    /** Optional index in `childProperty` on the new parent; omit to append. */
    index;
    constructor(nodeId, newParentId, childProperty, index) {
        this.newParentId = newParentId;
        this.nodeId = nodeId;
        this.childProperty = childProperty;
        this.index = index;
    }
    execute(core) {
        const { index, childProperty } = resolveParentChildProperty(core, this.nodeId);
        this.prevIndex = index;
        this.prevChildProperty = childProperty;
        const node = getNode(core, this.nodeId);
        const newParent = getNode(core, this.newParentId);
        const oldParentId = node.parent.get();
        const oldParent = getNode(core, oldParentId);
        this.prevParentId = oldParentId;
        this.childProperty = this.childProperty ?? this.prevChildProperty;
        if (!(this.childProperty in newParent))
            return false;
        setParent(oldParent, node, newParent, this.childProperty, this.index);
        return true;
    }
    undo(core) {
        const node = getNode(core, this.nodeId);
        if (!this.prevParentId)
            return false;
        const newParent = getNode(core, this.prevParentId);
        const oldParent = getNode(core, node.parent.get());
        if (oldParent === newParent && this.prevChildProperty === this.childProperty) {
            if (this.prevIndex === undefined)
                return true;
            if (newParent[this.prevChildProperty].get().indexOf(this.nodeId) === this.prevIndex)
                return true;
        }
        if (!(this.prevChildProperty in newParent))
            return false;
        setParent(oldParent, node, newParent, this.prevChildProperty, this.prevIndex);
        return true;
    }
}

export { SetNodeParentCommand as default };
