import { IPanelProperyNamesValues } from '../../../../declarations/Attributes.js';
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
import { PanelType } from '../../../../declarations/Panel.js';
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

const _PanelBase = NodeBuilder.create().withPosition3D().withRotation().withSize().withProperties(IPanelProperyNamesValues).withMaterialId().withGrain().withShape().withChildren('children').withAttributes().toClass();
class Panel extends _PanelBase {
    type = NodeType.Panel;
    panelType;
    edgeMaterialIds;
    // `properties` is seeded by the `withProperties(IPanelProperyNamesValues)`
    // builder step above — which carries the cross-cutting metadata keys
    // (`name` / `MVName` / `comment`) via `INodePropertyNamesValues` plus
    // `PanelProperty1`. Panel adds no further property keys here.
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        this.panelType = core.createValue(config.panelType ?? PanelType.body, options);
        this.edgeMaterialIds = config.edgeMaterialIds.map((e) => core.createValue(e, options));
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            panelType: this.panelType.get(),
            edgeMaterialIds: this.edgeMaterialIds.map((e) => e.get())
        };
    }
}

export { Panel };
