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
import { NodeType } from '../../../declarations/Node.js';
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
import getNode from './getNode.js';

const getPanel = (core, panelId) => {
    const panel = getNode(core, panelId);
    if (panel.type !== NodeType.Panel) {
        throw new Error(`Node with ID ${panelId} is not a panel.`);
    }
    return panel;
};

export { getPanel as default };
