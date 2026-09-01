import { MobileProjectSettings } from '../MobileProjectSettings.js';
import { WebProjectSettings } from '../WebProjectSettings.js';
import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import { CoreMode } from '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';

function createProjectSettings(core, projectSettingsDB, coreMode) {
    switch (coreMode) {
        case CoreMode.mobile:
            return new MobileProjectSettings(core, projectSettingsDB);
        case CoreMode.web:
            return new WebProjectSettings(core, projectSettingsDB);
        default:
            throw new Error(`Unknown CoreMode: ${coreMode}`);
    }
}

export { createProjectSettings };
