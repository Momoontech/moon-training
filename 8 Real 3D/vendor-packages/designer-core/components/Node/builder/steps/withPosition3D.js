import '../../../../declarations/Attributes.js';
import '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import { V3Axes } from '../../../../declarations/InterpretedLine.js';
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
import { serializeV3 } from '../../helpers/nodeSerialize.js';

const initV3Record = (core, v, options) => ({
    [V3Axes.x]: core.createValue(v.x, options),
    [V3Axes.y]: core.createValue(v.y, options),
    [V3Axes.z]: core.createValue(v.z, options)
});
const withPosition3D = (Base) => {
    const ConcreteBase = Base;
    class WithPosition3D extends ConcreteBase {
        position;
        constructor(config, core) {
            super(config, core);
            this.position = initV3Record(core, config.position, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), position: serializeV3(this.position) };
        }
    }
    return WithPosition3D;
};

export { initV3Record, withPosition3D };
