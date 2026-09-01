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

const _AdjustableBoxBase = NodeBuilder.create().withPosition3D().withRotation().withSize().withChildren('children').withAttributes().toClass();
class AdjustableBox extends _AdjustableBoxBase {
    type = NodeType.AdjustableBox;
    grainDirection;
    grainScale;
    materialTypes;
    materialIds;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        this.grainDirection = config.grainDirection.map((t) => core.createValue(t, options));
        this.grainScale = core.createValue(config.grainScale, options);
        this.materialTypes = config.materialTypes.map((t) => core.createValue(t, options));
        this.materialIds = core.createValue(config.materialIds, options);
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            grainDirection: this.grainDirection.map((t) => t.get()),
            grainScale: this.grainScale.get(),
            materialTypes: this.materialTypes.map((t) => t.get()),
            materialIds: this.materialIds.get()
        };
    }
}

export { AdjustableBox };
