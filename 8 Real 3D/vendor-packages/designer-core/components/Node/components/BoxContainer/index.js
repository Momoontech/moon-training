import { IBoxContainerPropertyNamesValues } from '../../../../declarations/Attributes.js';
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

const _BoxContainerBase = NodeBuilder.create()
    .withPosition3D().withRotation().withSize()
    .withProperties(IBoxContainerPropertyNamesValues)
    .withChildren('interiorComponents')
    .withChildren('exteriorComponents')
    .withInteriorLayout()
    .withExteriorLayout()
    .withAttributes().toClass();
class BoxContainer extends _BoxContainerBase {
    type = NodeType.BoxContainer;
    effects = getEffects(NodeType.BoxContainer);
    disposeEffects;
    constructor(config, core) {
        super(config, core);
        this.disposeEffects = registerNodeEffects(this);
        this.core.addNode(this);
    }
    dispose() {
        this.disposeEffects();
        super.dispose();
    }
}

export { BoxContainer };
