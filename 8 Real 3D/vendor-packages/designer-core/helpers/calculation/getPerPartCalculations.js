import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import getOptionalParentItem from '../../components/Node/helpers/getOptionalParentItem.js';
import getParentPart from '../../components/Node/helpers/getParentPart.js';
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
import { PartType, MultiClosetComponentType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getAttributeValue from '../getAttributeValue.js';
import getExistsRecursively from '../getExistsRecursively.js';
import getPropertyValue from '../getPropertyValue.js';
import { isMultiClosetStackPartType, isMultiClosetItemPartType } from '../multiCloset/contentPartTypes.js';
import { traverseNode } from '../traverseNode.js';
import { getCalculation } from './getCalculation.js';
import { getPerPartEntry } from './getPerPartEntry.js';
import { isClosetItem } from './internal/isClosetItem.js';

/** Part types NOT attached to a perPart root (their own calcs are line items elsewhere). */
const EXCLUDED_CHILD_PART_TYPES = new Set([
    PartType.doorPart,
    PartType.drawerPart,
    PartType.falsePanelPart,
    PartType.blindPanelPart,
    PartType.finishEndPart,
    PartType.shelfPart,
    PartType.countertopPart
]);
const getOptionalParentPart = (core, nodeId) => {
    try {
        return getParentPart(core, nodeId);
    }
    catch {
        return undefined;
    }
};
/** Vesta's perPart selection condition (calculations.ts lines 80-116), mapped to core node types. */
const qualifiesForPerPart = (core, node) => {
    // Phantom nodes (own or any ancestor `exists === 0`) are not built — mirrors
    // vesta's `scene.traverseVisible`. Excludes e.g. the 5 inactive multiCloset
    // joint subtrees (only one joint exists at a time).
    if (!getExistsRecursively(node))
        return false;
    const isPanelLike = node.type === NodeType.Panel || node.type === NodeType.Molding;
    const isPart = node.type === NodeType.Part;
    if (!isPart && !isPanelLike)
        return false;
    const item = getOptionalParentItem(core, node.id);
    if (!item || !isClosetItem(item))
        return false;
    const parent = getOptionalNode(core, node.parent.get());
    const parentType = parent?.type;
    if (isPanelLike) {
        return parentType === NodeType.Carcass;
    }
    // `multiClosetComponentType` is OPTIONAL on a Part — the catalog only declares it on content
    // components — so it must be read through `?.`, not asserted. Reading it unconditionally
    // throws on every ordinary part (toe-kick, separator, panel-like), i.e. on almost every node
    // this walk visits.
    const part = node;
    const partType = part.partType.get();
    // Toe-kicks and separators are structural parts directly under the closet Item — always counted.
    if (partType === PartType.toeKickPart || partType === PartType.multiClosetSeparator)
        return true;
    // multiCloset stacks are containers, not BOM records — their item parts (hanger/drawer) each
    // become their own record instead. Must precede the FreeBoxContainer branch (which would
    // otherwise catch the stack, since the stack's parent IS the FreeBoxContainer).
    if (isMultiClosetStackPartType(partType))
        return false;
    // A shelves stack's shelf COMPONENT is an empty compartment (an opening), not a panel — the
    // physical board is a `fixShelfHorizontal` (counted below). So the compartment holds no
    // material and is never a BOM record. The test is on the COMPONENT's own category, not on the
    // owning stack: the stack itself already returned above, and the drawer / hanger components of
    // a stack must still be counted.
    if (part.multiClosetComponentType?.get() === MultiClosetComponentType.multiClosetShelfPart)
        return false;
    if (isMultiClosetItemPartType(partType))
        return true;
    // Fix shelves (bay dividers AND the boards inside a shelves stack) are real panels — always a BOM
    // record unless explicitly hidden. `HideInCalculation` is the single toggle the user flips to pull
    // a shelf/divider in or out of the cut list; drawer-stack dividers carry `HideInCalculation:1`, so
    // they stay excluded here while shelf boards and bay dividers (no flag) are counted.
    if (partType === PartType.freeBoxContainerInteriorPart) {
        return !getPropertyValue(node, 'HideInCalculation') && !getAttributeValue(node, 'Combo');
    }
    // Any other part directly under a FreeBoxContainer stays a record unless hidden. (Fix-shelf
    // dividers, previously the sole reason this branch also checked isClosetShelf / parent-Carcass,
    // are now handled above regardless of parent.)
    const parentIsFbc = parentType === NodeType.FreeBoxContainer;
    if (parentIsFbc && !getPropertyValue(node, 'HideInCalculation') && !getAttributeValue(node, 'Combo')) {
        return true;
    }
    // Combo-group member: a part inside a parent Part flagged `Combo`.
    const parentPart = getOptionalParentPart(core, node.id);
    return (!!parentPart &&
        getCalculation(core, node) !== null &&
        !getPropertyValue(parentPart, 'HideInCalculation') &&
        !!getAttributeValue(parentPart, 'Combo'));
};
/** Attach every eligible descendant's calculation slice into the root entry's category arrays. */
const attachDescendants = (core, root, entry) => {
    const bucket = entry;
    traverseNode(root, (child) => {
        if (child.id === root.id)
            return;
        if (!getExistsRecursively(child))
            return; // skip phantom (exists === 0) descendants + their subtrees
        if (child.type === NodeType.Item)
            return;
        if (child.type === NodeType.Part &&
            EXCLUDED_CHILD_PART_TYPES.has(child.partType.get())) {
            return;
        }
        const calc = getCalculation(core, child);
        if (!calc)
            return;
        for (const key of Object.keys(calc)) {
            const value = calc[key];
            if (!value)
                continue;
            if (key === 'edgebandings') {
                bucket.edgebandings.push(...value);
            }
            else {
                bucket[key].push(value);
            }
        }
    });
};
/**
 * Vesta's `perPart` pass, reimplemented over core: for each closet item, walk
 * its subtree, select the qualifying parts (toe-kicks, fix-shelf dividers,
 * stacks, and carcass panels), and emit one entry each with its descendants'
 * BOM rolled into the entry's category arrays. Not grouped, not run through the
 * aggregate transform. Deduped by node id.
 */
const getPerPartCalculations = (core, closetItemIds) => {
    const entriesById = new Map();
    for (let i = 0; i < closetItemIds.length; i += 1) {
        const itemNode = getOptionalNode(core, closetItemIds[i]);
        if (!itemNode)
            continue;
        traverseNode(itemNode, (node) => {
            if (entriesById.has(node.id))
                return;
            if (!qualifiesForPerPart(core, node))
                return;
            const entry = getPerPartEntry(core, node);
            attachDescendants(core, node, entry);
            entriesById.set(node.id, entry);
        });
    }
    return [...entriesById.values()];
};

export { getPerPartCalculations };
