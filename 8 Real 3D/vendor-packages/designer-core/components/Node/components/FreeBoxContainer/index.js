import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import { FreeBoxContainerType } from '../../../../declarations/FreeBoxContainer.js';
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
import { getEffects } from '../../helpers/effectRegistry.js';
import { registerNodeEffects } from '../../helpers/registerNodeEffects.js';

const _FreeBoxContainerBase = NodeBuilder.create()
    .withPosition3D()
    .withRotation()
    .withSize()
    .withChildren('children')
    // Ordered slot for the multiCloset flavor's stacks + fix-shelf dividers; plain
    // FreeBoxContainers leave it empty and use `children`.
    .withChildren('bays')
    .withAttributes()
    .toClass();
const step32mm = 32 / 25.4; /* 32mm */
const defaultFirstHoleOffset = 9.5 / 25.4; /* 9.5mm */
class FreeBoxContainer extends _FreeBoxContainerBase {
    type = NodeType.FreeBoxContainer;
    freeBoxContainerType;
    // Disposer for the gated layout effect (only the multiCloset flavor registers one).
    disposeEffects;
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        this.freeBoxContainerType = core.createValue(config.freeBoxContainerType, options);
        // Opt into the stacking effect only for the multiCloset flavor (mirrors how `Item`
        // opts in by itemType). A plain FreeBoxContainer registers nothing → unchanged behavior.
        if (config.freeBoxContainerType === FreeBoxContainerType.multiCloset) {
            this.effects.push(...getEffects(FreeBoxContainerType.multiCloset));
            this.disposeEffects = registerNodeEffects(this);
        }
        this.core.addNode(this);
    }
    dispose() {
        this.disposeEffects?.();
        super.dispose();
    }
    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.freeBoxContainerType.get() ? { freeBoxContainerType: this.freeBoxContainerType.get() } : {})
        };
    }
}

export { FreeBoxContainer, defaultFirstHoleOffset, step32mm };
