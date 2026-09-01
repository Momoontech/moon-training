import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import '../../../../declarations/InterpretedLine.js';
import '../../../../declarations/Loader.js';
import { ModelType } from '../../../../declarations/Model.js';
import '../../../../declarations/Molding.js';
import '../../../../declarations/Node.js';
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
import { BaseModel } from '../../BaseModel.js';

class HingeModel extends BaseModel {
    modelType = ModelType.hinge;
    hingeType;
    materialId;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        this.hingeType = core.createValue(config.hingeType, options);
        this.materialId = core.createValue(config.materialId, options);
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            modelType: this.modelType,
            hingeType: this.hingeType.get(),
            materialId: this.materialId.get()
        };
    }
}

export { HingeModel };
