import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import getOptionalParentItem from '../../components/Node/helpers/getOptionalParentItem.js';
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
import getExistsRecursively from '../getExistsRecursively.js';
import getPropertyValue from '../getPropertyValue.js';
import { traverseNode } from '../traverseNode.js';
import { getCalculation } from './getCalculation.js';
import { getItemCalculation } from './getItemCalculation.js';
import { isClosetItem } from './internal/isClosetItem.js';

/**
 * Walk the scene subtree from `core.rootId` (via `traverseNode`, NOT the flat
 * `core.nodes` map) and collect a calculation slice per buildable node.
 *
 * `traverseNode` visits a node before its children, so an `Item` is always in
 * `perItemById` before its descendants are routed into it via `getOptionalParentItem`.
 * Closet / multiCloset items (and their subtrees) are excluded here — their ids are
 * returned for the `perPart` pass. HideInCalculation items are excluded entirely.
 */
const collectNodeCalculations = (core) => {
    const perItemById = new Map();
    const perProject = [];
    const closetItemIds = [];
    const root = getOptionalNode(core, core.rootId);
    if (!root)
        return { perItemById, perProject, closetItemIds };
    traverseNode(root, (node) => {
        // Skip phantom nodes (own or ancestor `exists === 0`) — matches vesta's
        // `traverseVisible`. Prevents soft-deleted / inactive subtrees from being counted.
        if (!getExistsRecursively(node))
            return;
        if (node.type === NodeType.Item) {
            if (getPropertyValue(node, 'HideInCalculation'))
                return;
            if (isClosetItem(node)) {
                closetItemIds.push(node.id);
                return;
            }
            perItemById.set(node.id, getItemCalculation(core, node));
            return;
        }
        // Skip descendant slices of an excluded item — `traverseNode` can't prune the
        // subtree, so gate on the owning item here. Closet descendants are handled by
        // the perPart pass; hidden descendants are dropped.
        const item = getOptionalParentItem(core, node.id);
        if (item && (getPropertyValue(item, 'HideInCalculation') || isClosetItem(item)))
            return;
        const slice = getCalculation(core, node);
        if (!slice)
            return;
        perProject.push(slice);
        if (item) {
            const owner = perItemById.get(item.id);
            if (owner)
                owner.calculations.push(slice);
        }
    });
    return { perItemById, perProject, closetItemIds };
};

export { collectNodeCalculations };
