import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
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
import { AngularUnits } from '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { convertOptionalSettings } from './helpers/convertOptionalSettings.js';
import Materials from './Materials/index.js';
import { ProjectAttributes } from './ProjectAttributes.js';
import { RoomSettings } from './RoomSettings.js';

// Shared properties between mobile and web modes
class ProjectSettingsBase {
    information;
    language;
    units;
    angularUnits;
    snapSensitivity;
    version;
    itemNumber;
    wallNumber;
    projectAttributes;
    materials;
    roomSettings;
    constructor(core, projectSettingsDB) {
        const convertedProjectSettings = convertOptionalSettings(projectSettingsDB.coreMode, projectSettingsDB);
        this.information = JSON.parse(JSON.stringify(convertedProjectSettings.information));
        this.language = core.createValue(convertedProjectSettings.language);
        this.units = core.createValue(convertedProjectSettings.units);
        // Default-safe for legacy projects saved before the angular-unit field existed.
        this.angularUnits = core.createValue(convertedProjectSettings.angularUnits ?? AngularUnits.DEG);
        // snapSensitivity is already a plain inches value after label stripping in converter
        this.snapSensitivity = core.createValue(convertedProjectSettings.snapSensitivity);
        this.version = convertedProjectSettings.version;
        this.itemNumber = convertedProjectSettings.itemNumber;
        this.wallNumber = convertedProjectSettings.wallNumber;
        this.materials = new Materials(core, convertedProjectSettings.materials);
        this.projectAttributes = new ProjectAttributes(core, convertedProjectSettings.projectAttributes);
        this.roomSettings = new RoomSettings(core, convertedProjectSettings.roomSettings);
    }
    serializeBase() {
        return {
            coreMode: this.coreMode,
            version: this.version,
            itemNumber: this.itemNumber,
            wallNumber: this.wallNumber,
            information: JSON.parse(JSON.stringify(this.information)),
            language: this.language.getSignal(),
            units: this.units.getSignal(),
            angularUnits: this.angularUnits.getSignal(),
            snapSensitivity: this.snapSensitivity.getSignal(),
            materials: this.materials.serialize(),
            projectAttributes: this.projectAttributes.serialize(),
            roomSettings: this.roomSettings.serialize()
        };
    }
}

export { ProjectSettingsBase };
