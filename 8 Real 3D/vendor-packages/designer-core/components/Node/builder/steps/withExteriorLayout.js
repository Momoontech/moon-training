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

const withExteriorLayout = (Base) => {
    const ConcreteBase = Base;
    class WithExteriorLayout extends ConcreteBase {
        exteriorLayout;
        constructor(config, core) {
            super(config, core);
            this.exteriorLayout = core.createValue(config.exteriorLayout || ContainerLayout.HEIGHT, { nodeId: this.id });
        }
        toJSON() {
            return { ...super.toJSON(), exteriorLayout: this.exteriorLayout.get() };
        }
    }
    return WithExteriorLayout;
};

export { withExteriorLayout };
