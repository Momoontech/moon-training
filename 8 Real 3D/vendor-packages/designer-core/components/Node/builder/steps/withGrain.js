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

const withGrain = (Base) => {
    const ConcreteBase = Base;
    class WithGrain extends ConcreteBase {
        grainDirection;
        grainOffset;
        constructor(config, core) {
            super(config, core);
            const opts = { nodeId: this.id };
            this.grainDirection = core.createValue(config.grainDirection, opts);
            if (config.grainOffset !== undefined) {
                this.grainOffset = {
                    [V2Axes.x]: core.createValue(config.grainOffset.x, opts),
                    [V2Axes.y]: core.createValue(config.grainOffset.y, opts)
                };
            }
        }
        toJSON() {
            return {
                ...super.toJSON(),
                grainDirection: this.grainDirection.getSignal(),
                ...(this.grainOffset
                    ? { grainOffset: { x: this.grainOffset[V2Axes.x].getSignal(), y: this.grainOffset[V2Axes.y].getSignal() } }
                    : {})
            };
        }
    }
    return WithGrain;
};

export { withGrain };
