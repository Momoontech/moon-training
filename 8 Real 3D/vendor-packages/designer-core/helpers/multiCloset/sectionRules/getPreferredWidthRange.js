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
 * Rule: preferred width window per content category.
 *  - hangers: 18-42" (LH 18-30", DH 30-42")
 *  - shelves: 24/30/42" -> 24-42"
 *  - drawers: 24/30"     -> 24-drawerMax"
 * Pure lookup against the configured widths, trivial to retune.
 */
const getPreferredWidthRange = (category, config) => {
    const { widest, narrow, drawerMax } = config.widths;
    switch (category) {
        case MultiClosetComponentType.multiClosetShortHangerPart:
            return { min: 18, max: widest };
        case MultiClosetComponentType.multiClosetLongHangerPart:
            return { min: 18, max: widest };
        case MultiClosetComponentType.multiClosetShelfPart:
            return { min: narrow, max: widest };
        case MultiClosetComponentType.multiClosetDrawerPart:
            return { min: narrow, max: drawerMax };
        default:
            return { min: narrow, max: widest };
    }
};

export { getPreferredWidthRange };
