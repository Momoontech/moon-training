import SetNodeSignalCommand from '../../commands/SetNodeSignalCommand.js';
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
import getStage from './getStage.js';

/**
 * Removes `node.id` from the `holes` map of every Wall2D on the current stage.
 *
 * Called from SetNodeParentCommand (before and after reparenting) and from
 * disposeNode. Walking all walls is necessary because the self-healing effect
 * may have written hole entries on both the front wall and a back wall — and
 * since no back-wall id is stored on the Item, we must scan all walls rather
 * than rely on stored bookkeeping.
 */
const removeWallHoleCurve = (node) => {
    const stageId = node.core.currentStage.get();
    const stage = getStage(node.core, stageId);
    const segIds = stage.segments.get();
    const cmds = [];
    for (const segId of segIds) {
        let seg;
        try {
            seg = getNode(node.core, segId);
        }
        catch {
            continue;
        }
        if (seg.type !== NodeType.RoomSegment)
            continue;
        const anySeg = seg;
        const wallId = anySeg.wall2D?.get();
        if (!wallId)
            continue;
        let wall;
        try {
            const w = getNode(node.core, wallId);
            if (w.type !== NodeType.Wall2D)
                continue;
            wall = w;
        }
        catch {
            continue;
        }
        const holes = wall.holes.get();
        if (!(node.id in holes))
            continue;
        const next = { ...holes };
        Reflect.deleteProperty(next, node.id);
        cmds.push(new SetNodeSignalCommand(wall.id, 'holes', next));
    }
    if (cmds.length > 0) {
        node.core.runCommandsAsTransaction(cmds, '', false);
    }
};

export { removeWallHoleCurve as default };
