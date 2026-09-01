import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
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
import { MultiClosetComponentType } from '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';

/**
 * Rule: "divide the space by the widest section available".
 *
 * Returns the widest preferred section width, clamped to the drawer max when any
 * drawers are desired (drawers cap out around 30"). This single function is the
 * one place to change the widest-first policy.
 */
const getTargetSectionWidth = (desired, config) => {
    const { widest, drawerMax } = config.widths;
    return desired[MultiClosetComponentType.multiClosetDrawerPart] > 0 ? Math.min(drawerMax, widest) : widest;
};

export { getTargetSectionWidth };
