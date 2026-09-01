import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import { V2Axes } from '../../declarations/InterpretedLine.js';
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

class SetNodeVector2Command {
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
            x: node[this.vector][V2Axes.x].peek(),
            y: node[this.vector][V2Axes.y].peek()
        };
        // Set new values
        node[this.vector][V2Axes.x].set(this.newValue.x);
        node[this.vector][V2Axes.y].set(this.newValue.y);
        return true;
    }
    undo(core) {
        const node = getNode(core, this.nodeId);
        if (!(`${this.vector}` in node))
            return false;
        if (!this.prevValue)
            return false;
        // Restore previous values
        node[this.vector][V2Axes.x].set(this.prevValue.x);
        node[this.vector][V2Axes.y].set(this.prevValue.y);
        return true;
    }
}

export { SetNodeVector2Command as default };
