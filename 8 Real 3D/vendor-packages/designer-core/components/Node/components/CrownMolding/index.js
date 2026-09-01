import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import { V2Axes } from '../../../../declarations/InterpretedLine.js';
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

const _CrownMoldingBase = NodeBuilder.create()
    .withPosition3D().withRotation()
    .withShape().withContours()
    .withGrain().withMaterialId()
    .withChildren('children')
    .withAttributes()
    .toClass();
class CrownMolding extends _CrownMoldingBase {
    type = NodeType.CrownMolding;
    // V2 size — intentionally different from standard V3 size, see Vesta
    size;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        this.size = {
            [V2Axes.x]: core.createValue(1, options),
            [V2Axes.y]: core.createValue(1, options)
        };
        this.core.addNode(this);
    }
    toJSON() {
        return super.toJSON();
    }
}

export { CrownMolding };
