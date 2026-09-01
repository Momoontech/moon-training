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

const _MountLineBase = NodeBuilder.create().withPosition3D().withRotation().withMount().withChildren('children').withAttributes().toClass();
class MountLine extends _MountLineBase {
    type = NodeType.MountLine;
    size;
    constructor(config, core) {
        super(config, core);
        if (config.size) {
            const opts = { nodeId: this.id };
            this.size = {
                [V2Axes.x]: core.createValue(config.size.x, opts),
                [V2Axes.y]: core.createValue(config.size.y, opts)
            };
        }
        this.core.addNode(this);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.size ? { size: { x: this.size[V2Axes.x].getSignal(), y: this.size[V2Axes.y].getSignal() } } : {})
        };
    }
}

export { MountLine };
