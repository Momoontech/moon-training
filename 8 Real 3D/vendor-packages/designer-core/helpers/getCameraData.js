import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import { GeneralViewMode } from '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';

const getCameraData = (core) => {
    const viewMode = core.generalViewMode.get();
    switch (viewMode) {
        case GeneralViewMode.floorPlan:
            return core.fCameraData.get();
        case GeneralViewMode.editor3D:
        default:
            return core.e3CameraData.get();
        case GeneralViewMode.editor2D:
            return core.e2CameraData.get();
        case GeneralViewMode.walkthrough:
            return core.wCameraData.get();
    }
};

export { getCameraData };
