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
import { NodeBuilder } from '../../builder/NodeBuilder.js';

const _Wall2DBase = NodeBuilder.create().withMaterialId().withChildren('children').withAttributes().toClass();
class Wall2D extends _Wall2DBase {
    type = NodeType.Wall2D;
    holes;
    constructor(config, core) {
        super(config, core);
        this.holes = core.createValue({}, { nodeId: this.id });
        this.core.addNode(this);
    }
    toJSON() {
        return super.toJSON();
    }
}

export { Wall2D };
