import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
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
import { PartType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';

/**
 * Route a click on a shelves-stack empty COMPARTMENT (a component part of the
 * `multiClosetShelfPart` category) to the adjustable shelf
 * BOARD it should select. The compartments are not selectable; instead the empty gaps act as extended
 * hit regions for their neighbouring boards.
 *
 * A shelves stack interleaves `[compartment, board, compartment, …, compartment]`, so a compartment at
 * child index `i` has its board above at `i+1` and below at `i-1`:
 *   - bottom/first compartment (no board below) → the board above it,
 *   - top/last compartment (no board above) → the board below it,
 *   - a middle compartment → the board above when `topHalf`, else the board below.
 *
 * `topHalf` is whether the click landed in the upper half of the compartment (caller computes it in the
 * compartment's local frame, so it is rotation-independent). Returns `undefined` when `compartmentId`
 * is not a compartment sitting in a stack, or has no adjacent board.
 */
const getShelfBoardForCompartmentClick = (core, compartmentId, topHalf) => {
    const compartment = getOptionalNode(core, compartmentId);
    if (!compartment || compartment.type !== NodeType.Part)
        return undefined;
    const stack = getOptionalNode(core, compartment.parent.get());
    if (!stack || stack.type !== NodeType.Part)
        return undefined;
    const childIds = stack.children.get();
    const index = childIds.indexOf(compartmentId);
    if (index < 0)
        return undefined;
    const boardIdAt = (childIndex) => {
        const id = childIds[childIndex];
        if (!id)
            return undefined;
        const node = getOptionalNode(core, id);
        return node &&
            node.type === NodeType.Part &&
            node.partType.get() === PartType.freeBoxContainerInteriorPart
            ? id
            : undefined;
    };
    const above = boardIdAt(index + 1);
    const below = boardIdAt(index - 1);
    if (!below)
        return above; // bottom / first compartment
    if (!above)
        return below; // top / last compartment
    return topHalf ? above : below;
};

export { getShelfBoardForCompartmentClick };
