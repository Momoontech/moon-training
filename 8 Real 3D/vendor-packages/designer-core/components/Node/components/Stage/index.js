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
import { getNodeAttributesConfig } from '../../helpers/getNodeAttributesConfig.js';
import { BaseNode } from '../../BaseNode.js';

class Stage extends BaseNode {
    type = NodeType.Stage;
    points;
    segments;
    rooms;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        const attrs = config.attributes;
        if (attrs) {
            for (const [key, value] of Object.entries(attrs)) {
                // @typescript-eslint/no-explicit-any
                this.attributes.set(key, core.createValue(value, options));
            }
        }
        this.points = core.createValue(config.points, options);
        this.segments = core.createValue(config.segments, options);
        this.rooms = core.createValue(config.rooms, options);
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...this.baseJSON(),
            attributes: getNodeAttributesConfig(this),
            points: this.points.get(),
            segments: this.segments.get(),
            rooms: this.rooms.get()
        };
    }
}

export { Stage };
