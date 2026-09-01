import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import { getEffectiveContentLocked } from '../../components/Node/helpers/getResizableSides.js';
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
import { PartType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';

/**
 * Affordance gates behind the toolbar's Replace button — one predicate per replaceable KIND, plus the
 * union the button reads. Each is the path-independent half of its builder in `./replaceNode`, so the
 * button, the picker's scope and the swap are gated by the SAME signal-tracked read.
 */
/** Is this node's CONTENT swappable — a multiCloset section the lock cascade leaves unlocked. */
const canReplaceSectionContent = (core, nodeId) => {
    const section = getOptionalNode(core, nodeId);
    if (section?.type !== NodeType.Part || section.partType.get() !== PartType.multiClosetSection)
        return false;
    return !getEffectiveContentLocked(core, nodeId);
};
/**
 * Is this a replaceable placed PRODUCT — an Item whose whole node can be swapped for another preset.
 * `false` for a multiCloset Item: a closet is replaced section by section, and swapping it wholesale
 * would discard every section under it. Products have no lock flag yet; this is the line to read it.
 */
const canReplaceItem = (core, nodeId) => {
    const item = getOptionalNode(core, nodeId);
    if (item?.type !== NodeType.Item)
        return false;
    return item.itemType.get() !== ItemType.multiCloset;
};
/**
 * Is this node replaceable AT ALL — a multiCloset SECTION (its content is swapped) or a placed product
 * ITEM (the node itself is). A third kind is a new gate plus one clause here, and the matching branch
 * in `getReplaceScope` / `applyReplaceNode`.
 */
const canReplaceNode = (core, nodeId) => canReplaceSectionContent(core, nodeId) || canReplaceItem(core, nodeId);

export { canReplaceItem, canReplaceNode, canReplaceSectionContent };
