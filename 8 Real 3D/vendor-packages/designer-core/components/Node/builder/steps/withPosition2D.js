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

const withPosition2D = (Base) => {
    const ConcreteBase = Base;
    class WithPosition2D extends ConcreteBase {
        position;
        constructor(config, core) {
            super(config, core);
            const opts = { nodeId: this.id };
            this.position = {
                [V2Axes.x]: core.createValue(config.position.x, opts),
                [V2Axes.y]: core.createTransformedValue(config.position.y, opts, (v) => -v)
            };
        }
        toJSON() {
            return {
                ...super.toJSON(),
                position: { x: this.position[V2Axes.x].get(), y: this.position[V2Axes.y].get() }
            };
        }
    }
    return WithPosition2D;
};

export { withPosition2D };
