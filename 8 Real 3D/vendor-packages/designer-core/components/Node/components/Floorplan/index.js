import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import '../../../../declarations/InterpretedLine.js';
import '../../../../declarations/Loader.js';
import '../../../../declarations/Model.js';
import '../../../../declarations/Molding.js';
import { NodeType } from '../../../../declarations/Node.js';
import '../../../../declarations/Panel.js';
import '../../../../declarations/PaperSpace.js';
import '../../../../declarations/Part.js';
import '../../../../declarations/ProjectSettings.js';
import '../../../../declarations/Segment.js';
import '../../../../declarations/SurfaceSettings.js';
import '../../../../declarations/systems.js';
import '../../../../declarations/UIAttributes.js';
import '../../../../declarations/Valance.js';
import '../../../../declarations/views.js';
import { getMonitor } from '../../../../helpers/monitor.js';

class Floorplan {
    id;
    core;
    type = NodeType.Floorplan;
    stages;
    parent;
    effects = [];
    exists;
    attributes = new Map();
    constructor(config, core) {
        this.id = config.uuid;
        this.core = core;
        this.core.registerNode(this);
        const options = { nodeId: this.id };
        this.parent = core.createValue('', options);
        this.stages = core.createValue(config.stages, options);
        this.exists = core.createValue(1);
        this.core.addNode(this);
    }
    dispose() {
        this.core.unregisterNode(this.id);
        getMonitor().debug(`disposing node ${this.id}`);
        // this.core.disposeNode(this);
    }
    toJSON() {
        return {
            uuid: this.id,
            type: this.type,
            stages: this.stages.get()
        };
    }
}

export { Floorplan };
