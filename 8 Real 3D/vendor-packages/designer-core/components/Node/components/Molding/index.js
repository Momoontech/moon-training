import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import '../../../../declarations/InterpretedLine.js';
import '../../../../declarations/Loader.js';
import '../../../../declarations/Model.js';
import { MoldingType } from '../../../../declarations/Molding.js';
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

const _MoldingBase = NodeBuilder.create()
    .withPosition3D()
    .withRotation()
    .withChildren('children')
    .withShape()
    .withAttributes()
    .toClass();
class Molding extends _MoldingBase {
    type = NodeType.Molding;
    moldingType;
    constructor(config, core) {
        super(config, core);
        this.moldingType = core.createValue(config.moldingType, { nodeId: this.id });
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            moldingType: this.moldingType.get()
        };
        //TODO: fix conflict DecoMoldingConfig | BaseboardConfig vs MoldingConfig
    }
}
const _SimpleMoldingBase = NodeBuilder.create()
    .withPosition3D()
    .withRotation()
    .withChildren('children')
    .withAttributes()
    .toClass();
class SimpleMolding extends _SimpleMoldingBase {
    type = NodeType.Molding;
    moldingType;
    constructor(config, core) {
        super(config, core);
        this.moldingType = core.createValue(config.moldingType, { nodeId: this.id });
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            moldingType: this.moldingType.get()
        };
    }
}
function createMolding(config, core) {
    if (config.moldingType === MoldingType.decoMolding || config.moldingType === MoldingType.baseboard) {
        return new Molding(config, core);
    }
    return new SimpleMolding(config, core);
}

export { Molding, SimpleMolding, createMolding };
