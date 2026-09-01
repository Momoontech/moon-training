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
import { NodeType } from '../../declarations/Node.js';
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
import { getEdgebandingCalculation } from './getEdgebandingCalculation.js';
import { getGlassCalculation } from './getGlassCalculation.js';
import { getItemCalculation } from './getItemCalculation.js';
import { getLaminateCalculation } from './getLaminateCalculation.js';
import { getModelCalculation } from './getModelCalculation.js';
import { getPanelCalculation } from './getPanelCalculation.js';
import { getPartCalculation } from './getPartCalculation.js';

/**
 * Per-node calculation dispatcher: maps a node to its BOM slice (or, for an
 * `Item`, the item-level shell). Returns `null` for node types that emit no
 * calculation. No methods live on the Node classes — all logic is in these
 * standalone helpers, dispatched here by `node.type`.
 *
 * Phase-2 node types (Countertop / ToeKickPanel / Valance / CrownMolding /
 * Molding) return `null` for now — they need sibling merge-groups and built
 * geometry that core does not retain. Adding them later does not change the
 * public API or the category types.
 */
const getCalculation = (core, node) => {
    switch (node.type) {
        case NodeType.Panel:
        case NodeType.MiteredPanel:
            return getPanelCalculation(core, node);
        case NodeType.Item:
            return getItemCalculation(core, node);
        case NodeType.Part:
            return getPartCalculation(core, node);
        case NodeType.Model:
            return getModelCalculation(core, node);
        case NodeType.Edgebanding:
            return getEdgebandingCalculation(core, node);
        case NodeType.Glass:
            return getGlassCalculation(core, node);
        case NodeType.LaminateBox:
            return getLaminateCalculation(core, node);
        // Phase 2 — need merge-groups / built geometry (see the calculation plan).
        case NodeType.Countertop:
        case NodeType.ToeKickPanel:
        case NodeType.Valance:
        case NodeType.CrownMolding:
        case NodeType.Molding:
        default:
            return null;
    }
};

export { getCalculation };
