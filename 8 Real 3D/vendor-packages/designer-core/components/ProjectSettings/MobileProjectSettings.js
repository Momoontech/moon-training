import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import { CoreMode } from '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { convertOptionalSettings } from './helpers/convertOptionalSettings.js';
import { MobileSettings } from './MobileSettings.js';
import { ProjectSettingsBase } from './ProjectSettingsBase.js';

class MobileProjectSettings extends ProjectSettingsBase {
    coreMode = CoreMode.mobile;
    mobileSettings;
    constructor(core, projectSettingsDB) {
        super(core, projectSettingsDB);
        const convertedProjectSettings = convertOptionalSettings(projectSettingsDB.coreMode, projectSettingsDB);
        // Type guard: mobileSettings must be present when coreMode is 'mobile'
        if (convertedProjectSettings.coreMode === CoreMode.mobile && convertedProjectSettings.mobileSettings) {
            this.mobileSettings = new MobileSettings(core, convertedProjectSettings.mobileSettings);
        }
        else {
            throw new Error('Invalid ProjectSettings: mobileSettings must be present when coreMode is mobile');
        }
    }
    serialize() {
        return {
            ...this.serializeBase(),
            mobileSettings: { step: this.mobileSettings.step.getSignal() }
        };
    }
}

export { MobileProjectSettings };
