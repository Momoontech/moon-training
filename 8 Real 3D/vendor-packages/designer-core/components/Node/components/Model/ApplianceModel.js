import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import { V3Axes } from '../../../../declarations/InterpretedLine.js';
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
import { serializeV3 } from '../../helpers/nodeSerialize.js';
import { BaseModel } from '../../BaseModel.js';

class ApplianceModel extends BaseModel {
    modelType = ModelType.applianceModel;
    modelId;
    isSizable;
    isScalable;
    isPositioned;
    size;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        this.modelId = core.createValue(config.modelId, options);
        if ('isSizable' in config && config.isSizable) {
            this.isSizable = core.createValue(config.isSizable, options);
        }
        if ('isPositioned' in config && config.isPositioned) {
            this.isPositioned = core.createValue(config.isPositioned, options);
        }
        if ('isScalable' in config && config.isScalable) {
            this.isScalable = core.createValue(config.isScalable, options);
            this.size = {
                [V3Axes.x]: core.createValue(config.size.x ?? 1, options),
                [V3Axes.y]: core.createValue(config.size.y ?? 1, options),
                [V3Axes.z]: core.createValue(config.size.z ?? 1, options)
            };
        }
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            modelType: this.modelType,
            modelId: this.modelId.get(),
            ...(this.size ? { size: serializeV3(this.size) } : {}),
            ...(this.isScalable ? { isScalable: this.isScalable.get() } : {}),
            ...(this.isSizable ? { isSizable: this.isSizable.get() } : {}),
            ...(this.isPositioned ? { isPositioned: this.isPositioned.get() } : {})
        };
    }
}

export { ApplianceModel };
