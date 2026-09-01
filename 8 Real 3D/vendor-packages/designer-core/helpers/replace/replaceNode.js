import { RemoveNodeCommand } from '../../components/commands/CreateNodeCommand.js';
import CreateNodeFromCatalogCommand from '../../components/commands/CreateNodeFromCatalogCommand.js';
import ReplaceNodeFromCatalogCommand from '../../components/commands/ReplaceNodeFromCatalogCommand.js';
import SetSelectedNodeIdCommand from '../../components/commands/SetSelectedNodeIdCommand.js';
import getItem from '../../components/Node/helpers/getItem.js';
import getPart from '../../components/Node/helpers/getPart.js';
import { generateId } from '../id.js';
import { canReplaceSectionContent, canReplaceItem } from './canReplace.js';

/**
 * Swaps a section's CONTENT for the preset at `catalogPath`, or `null` when invalid. Mirrors Phase B of
 * `applyMultiClosetSections` (and `dragOnPart`), so a picked preset lands like a planned one — and the
 * section NODE is untouched, so its box survives and the layout effect refits the new content into it.
 */
const replaceSectionContent = (core, nodeId, catalogPath) => {
    if (!canReplaceSectionContent(core, nodeId))
        return null;
    const section = getPart(core, nodeId);
    const commands = section.content.get().map((contentId) => new RemoveNodeCommand(contentId));
    commands.push(new CreateNodeFromCatalogCommand(catalogPath, nodeId, generateId(), {}, 'content', 0));
    return commands;
};
/**
 * Swaps a placed product ITEM for the preset at `catalogPath`, or `null` when invalid. The preset's own
 * `size` wins, but product entries carry no `position` / `rotation` (the drop path supplies those, and
 * `withPosition3D` reads them unguarded), so the original's is seeded in — verbatim, formulas included.
 */
const replaceItem = (core, nodeId, catalogPath) => {
    if (!canReplaceItem(core, nodeId))
        return null;
    const item = getItem(core, nodeId);
    const placement = {
        position: {
            x: item.position.x.getSignal(),
            y: item.position.y.getSignal(),
            z: item.position.z.getSignal()
        },
        rotation: {
            x: item.rotation.x.getSignal(),
            y: item.rotation.y.getSignal(),
            z: item.rotation.z.getSignal()
        }
    };
    const replace = new ReplaceNodeFromCatalogCommand(nodeId, catalogPath, placement);
    return { commands: [replace], newNodeId: replace.getNewNodeId() };
};
/** Undo-history label for the whole swap, whichever kind it turns out to be. */
const REPLACE_TRANSACTION = 'Replace';
/**
 * Replaces `nodeId` with the preset at `catalogPath`; returns whether anything applied. THE call a
 * picker makes — it branches on what the node IS, refuses what `canReplaceNode` refuses, and owns the
 * transaction split the Item swap needs (see below). Pairs with `getReplaceScope`, same branches.
 */
const applyReplaceNode = (core, nodeId, catalogPath) => {
    if (canReplaceSectionContent(core, nodeId)) {
        const commands = replaceSectionContent(core, nodeId, catalogPath);
        if (!commands)
            return false;
        // The section node survives, so the selection stays valid and nothing touches it.
        core.runCommandsAsTransaction(commands, REPLACE_TRANSACTION);
        return true;
    }
    const plan = replaceItem(core, nodeId, catalogPath);
    if (!plan)
        return false;
    // CLEARED FIRST, inside the swap's own transaction. The swap DELETES the selected node, and this
    // pack's batch flushes at its end — so without this, effects flush once with the selection still
    // naming a node the graph no longer holds, and every consumer that resolves it (`getNode` /
    // `getItem` — eight sites in `designer-ui`, e.g. `useWallItemClearances`) throws right there.
    // `null` is the one selection value that is always valid. It also makes the reverse pass safe:
    // undone back-to-front this command runs LAST, restoring the original id only once the original
    // node is back — so neither direction ever exposes a dangling selection.
    core.runCommandsAsTransaction([new SetSelectedNodeIdCommand(null), ...plan.commands], REPLACE_TRANSACTION);
    // The swap mints a NEW id, so the selection must follow — but in its OWN transaction: signals flush
    // batched effects LIFO and designer3d registers `syncNodeViewsEffect` last, so selecting inside the
    // swap's batch hits `getNodeView` before the view exists. Folds into it, so still one undo step.
    core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(plan.newNodeId));
    return true;
};

export { applyReplaceNode, replaceItem, replaceSectionContent };
