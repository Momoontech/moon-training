import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import { V3Axes } from '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getNode from '../Node/helpers/getNode.js';

class SetNodeVector3Command {
    nodeId;
    vector;
    prevValue = undefined;
    newValue;
    constructor(nodeId, vector, newValue) {
        this.nodeId = nodeId;
        this.vector = vector;
        this.newValue = newValue;
    }
    execute(core) {
        const node = getNode(core, this.nodeId);
        if (!(`${this.vector}` in node))
            return false;
        // Store previous values
        this.prevValue = {
            x: node[this.vector][V3Axes.x].get(),
            y: node[this.vector][V3Axes.y].get(),
            z: node[this.vector][V3Axes.z].get()
        };
        // Set new values
        node[this.vector][V3Axes.x].set(this.newValue.x);
        node[this.vector][V3Axes.y].set(this.newValue.y);
        node[this.vector][V3Axes.z].set(this.newValue.z);
        return true;
    }
    undo(core) {
        const node = getNode(core, this.nodeId);
        if (!(`${this.vector}` in node))
            return false;
        if (!this.prevValue)
            return false;
        // Restore previous values
        node[this.vector][V3Axes.x].set(this.prevValue.x);
        node[this.vector][V3Axes.y].set(this.prevValue.y);
        node[this.vector][V3Axes.z].set(this.prevValue.z);
        return true;
    }
}

export { SetNodeVector3Command as default };
