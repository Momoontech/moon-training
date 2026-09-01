import '../../../../declarations/Attributes.js';
import { ContainerLayout } from '../../../../declarations/BoxContainer.js';
import '../../../../declarations/CoreDesigner.js';
import '../../../../declarations/Edgebanding.js';
import '../../../../declarations/FreeBoxContainer.js';
import '../../../../declarations/helpers.js';
import '../../../../declarations/InterpretedLine.js';
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

const withInteriorLayout = (Base) => {
    const ConcreteBase = Base;
    class WithInteriorLayout extends ConcreteBase {
        interiorLayout;
        constructor(config, core) {
            super(config, core);
            this.interiorLayout = core.createValue(config.interiorLayout || ContainerLayout.HEIGHT, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), interiorLayout: this.interiorLayout.get() };
        }
    }
    return WithInteriorLayout;
};

export { withInteriorLayout };
