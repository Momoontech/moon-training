import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../declarations/helpers.js';
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

/**
 * Return the ids of every multiCloset Item in the project.
 *
 * Walks the reactive `nodeIds` set once and keeps the Items whose `itemType`
 * is `multiCloset` (mirrors {@link getNodesBySystem}, minus the system filter).
 * Returns an empty array when the scene holds no closets.
 *
 * Pair with `getItem(core, id).isGenerated` to tell already-filled closets from
 * fresh ones — this is what `fillMultiClosets` uses to skip generated closets.
 */
const getAllMultiClosets = (core) => {
    const result = [];
    for (const id of core.nodeIds.get()) {
        const candidate = getOptionalNode(core, id);
        if (candidate && candidate.type === NodeType.Item && candidate.itemType.get() === ItemType.multiCloset) {
            result.push(id);
        }
    }
    return result;
};

export { getAllMultiClosets as default };
