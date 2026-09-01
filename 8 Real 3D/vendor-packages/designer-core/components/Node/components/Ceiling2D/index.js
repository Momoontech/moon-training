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
import { getEffects } from '../../helpers/effectRegistry.js';
import { registerNodeEffects } from '../../helpers/registerNodeEffects.js';
import { NodeBuilder } from '../../builder/NodeBuilder.js';

const _Ceiling2DBase = NodeBuilder.create().withMaterialId().withChildren('children').withAttributes().toClass();
class Ceiling2D extends _Ceiling2DBase {
    type = NodeType.Ceiling2D;
    effects = getEffects(NodeType.Ceiling2D);
    disposeEffects;
    constructor(config, core) {
        super(config, core);
        this.disposeEffects = registerNodeEffects(this);
        this.core.addNode(this);
    }
    dispose() {
        this.disposeEffects?.();
        super.dispose();
    }
    toJSON() {
        return super.toJSON();
    }
}

export { Ceiling2D };
