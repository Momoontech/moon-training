import { IModelProperyNamesValues } from '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import { NodeType } from '../../declarations/Node.js';
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
import { NodeBuilder } from './builder/NodeBuilder.js';

const _BaseModelBase = NodeBuilder.create()
    .withPosition3D()
    .withRotation()
    .withChildren('children')
    .withAttributes()
    .toClass();
class BaseModel extends _BaseModelBase {
    type = NodeType.Model;
    constructor(config, core) {
        super(config, core);
        // `BaseNode` leaves `properties` empty; seed the Model key set here.
        // `IModelProperyNamesValues` already includes the cross-cutting metadata
        // keys (`name` / `MVName` / `comment` via `INodePropertyNamesValues`), so
        // this single loop covers them too. Append into the inherited Map —
        // never reassign it.
        const options = { nodeId: this.id };
        for (let i = 0; i < IModelProperyNamesValues.length; i++) {
            this.properties.set(IModelProperyNamesValues[i], core.createValue(config[IModelProperyNamesValues[i]], options));
        }
    }
}

export { BaseModel };
