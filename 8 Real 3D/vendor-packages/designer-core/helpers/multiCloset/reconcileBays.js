import { RemoveNodeCommand } from '../../components/commands/CreateNodeCommand.js';
import CreateNodeFromCatalogCommand from '../../components/commands/CreateNodeFromCatalogCommand.js';
import { DuplicateNodeCommand } from '../../components/commands/DuplicateNodeCommand.js';
import SetNodeSignalCommand from '../../components/commands/SetNodeSignalCommand.js';
import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import { FreeBoxContainerType } from '../../declarations/FreeBoxContainer.js';
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
import { generateId } from '../id.js';
import { isMultiClosetStackPartType } from './contentPartTypes.js';
import { reconcileFreeBoxContainerBays } from './stackLayout.js';

/**
 * Catalog template for a fix-shelf divider. Only reached when a column has no shelf left to
 * clone from — every ordinary repair duplicates a surviving neighbour instead, so the new
 * shelf inherits that column's material, width and attributes. Mirrors the hardcoded
 * separator path in `updateMultiClosetItemLayoutEffect`.
 */
const FIX_SHELF_CATALOG_PATH = 'master/Parts/General/fixShelfHorizontal';
/**
 * Commands that restore the `divider, stack, divider, …, divider` invariant of a multiCloset
 * FreeBoxContainer's `bays`: `max(2, stacks + 1)` fix shelves, strictly alternating. An empty
 * column keeps BOTH bracketing shelves, which is why dropping the first stack into a section
 * adds no shelf and every stack after it adds one.
 *
 * Returns `[]` when the column is already well-formed (the common case), so callers can splat
 * it unconditionally into an existing pack.
 *
 * This is the single owner of the count. It is invoked from the gestures that mutate `bays` —
 * the stack drop (`commitDragOnFreeBoxContainer`) and the stack delete (`toolbarDeleteSelection`)
 * — rather than from the layout effect, deliberately:
 *  - `CreateNodeFromCatalogCommand` / `CreateNodeCommand` construct a node with its child
 *    arrays EMPTY and attach the children afterwards, so an effect-based reconciler runs once
 *    against a phantom 0-bay column and injects shelves the loader then has to fight;
 *  - `dragOnFreeBoxContainer` rewrites `bays` on every pointermove, and `fixShelfHorizontal`
 *    is a whole subtree (BoxContainer → shelf Part, MountPoint, stripLight Model) — cloning it
 *    per frame is not affordable at 120 Hz;
 *  - commands emitted here land inside the caller's transaction, so the repair is one undo step
 *    with the gesture that caused it.
 *
 * Reads `bays` UNFILTERED: `exists` decides whether a bay OCCUPIES grid space (the layout
 * effect's concern), never whether it is part of the column's structure. Filtering here would
 * miscount a temporarily-hidden bay — e.g. the catalog-drag preview, which sets `exists = 0` on
 * the in-flight node — and delete a shelf that has to come back.
 */
const reconcileFreeBoxContainerBaysCommands = (core, fbcId, options = {}) => {
    const fbc = getOptionalNode(core, fbcId);
    if (!fbc ||
        fbc.type !== NodeType.FreeBoxContainer ||
        fbc.freeBoxContainerType.get() !== FreeBoxContainerType.multiCloset) {
        return [];
    }
    const shapeOf = (id) => {
        const bay = getOptionalNode(core, id);
        if (!bay || bay.type !== NodeType.Part)
            return null;
        return { id, isStack: isMultiClosetStackPartType(bay.partType.get()) };
    };
    const pending = options.pendingRemovals ?? [];
    const bays = [];
    for (const id of fbc.bays.get()) {
        if (pending.includes(id))
            continue;
        const shape = shapeOf(id);
        if (shape)
            bays.push(shape);
    }
    const { pendingInsert } = options;
    if (pendingInsert) {
        const shape = shapeOf(pendingInsert.id);
        if (shape) {
            // Detach then insert at `at`, exactly as `setParent` will.
            const existing = bays.findIndex((bay) => bay.id === pendingInsert.id);
            if (existing >= 0)
                bays.splice(existing, 1);
            bays.splice(Math.max(0, Math.min(pendingInsert.at, bays.length)), 0, shape);
        }
    }
    const { removeDividerIds, orderedBayIds, insertions } = reconcileFreeBoxContainerBays(bays);
    if (removeDividerIds.length === 0 && orderedBayIds === null && insertions.length === 0) {
        return [];
    }
    // Order matters: remove → reorder → insert.
    const commands = removeDividerIds.map((id) => new RemoveNodeCommand(id));
    if (orderedBayIds) {
        // A pure permutation of the surviving bays — this is the relocation path, and the reason a
        // stack can be dragged across a shelf boundary without the shelf being destroyed and
        // rebuilt. `pendingRemovals` ids are already excluded from `orderedBayIds`, so this also
        // splices them out of `bays` ahead of the caller's own RemoveNodeCommand.
        commands.push(new SetNodeSignalCommand(fbcId, 'bays', orderedBayIds));
    }
    // `at` indexes the reordered, post-removal array. Apply DESCENDING so each index stays valid
    // as earlier inserts shift the array.
    for (const { at, templateId } of [...insertions].sort((a, b) => b.at - a.at)) {
        commands.push(templateId
            ? new DuplicateNodeCommand(templateId, {
                parentId: fbcId,
                childProperty: 'bays',
                insertIndex: at
            })
            : new CreateNodeFromCatalogCommand(FIX_SHELF_CATALOG_PATH, fbcId, generateId(), {}, 'bays', at));
    }
    return commands;
};

export { FIX_SHELF_CATALOG_PATH, reconcileFreeBoxContainerBaysCommands };
