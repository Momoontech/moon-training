import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../../declarations/helpers.js';
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
import getOptionalNode from './getOptionalNode.js';

/**
 * Return the ids of every multiCloset Item assigned to the given system.
 *
 * Only multiCloset Items carry a `system` reference, so the result is the set
 * of closets that make up the system. Returns an empty array when no closet is
 * assigned to the given system.
 *
 * Pair with {@link getSystemById} to resolve a node id into its system first.
 */
const getNodesBySystem = (core, systemId) => {
    const result = [];
    for (const id of core.nodeIds.get()) {
        const candidate = getOptionalNode(core, id);
        if (candidate &&
            candidate.type === NodeType.Item &&
            candidate.itemType.get() === ItemType.multiCloset &&
            candidate.system?.get() === systemId) {
            result.push(id);
        }
    }
    return result;
};

export { getNodesBySystem as default };
