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
import { getDefaultMobileSettings } from './getDefaultMobileSettings.js';
import { getDefaultWebSettings } from './getDefaultWebSettings.js';

const convertOptionalSettings = (coreMode, projectSettingsDB) => {
    if (coreMode === projectSettingsDB.coreMode)
        return projectSettingsDB;
    switch (coreMode) {
        case CoreMode.mobile:
            return {
                ...projectSettingsDB,
                ...getDefaultMobileSettings()
            };
        case CoreMode.web:
            Reflect.deleteProperty(projectSettingsDB, 'mobileSettings');
            const webSettings = {
                ...projectSettingsDB,
                ...getDefaultWebSettings()
            };
            return webSettings;
    }
};

export { convertOptionalSettings };
