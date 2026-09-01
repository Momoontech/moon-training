import getNodesBySystem from '../../components/Node/helpers/getNodesBySystem.js';
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
import { MultiClosetComponentType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getPropertyValue from '../getPropertyValue.js';
import { emptyPieceCounts } from './sectionRules/pieceBudget.js';

/**
 * How many PIECES a system's existing closets already account for, read off the SCENE.
 *
 * This is what makes the fundamental-design allowance survive across separate
 * `fillMultiClosets()` calls. The budget is built fresh on every call, so without this a closet
 * dragged out and generated LATER would start from the full allowance and the system would be
 * over-delivered — three Office Desk Systems generated one at a time would each get their own
 * 5 shelves and 4 drawers, while generating all three at once correctly shares one set. The
 * allowance belongs to the system, not to a call.
 *
 * **Derived, never stored.** There is no persisted "spent" counter to migrate, serialize, or repair:
 * the answer is recomputed from what is actually in the scene, so deleting a section frees its
 * pieces again and an undo needs no special handling.
 *
 * **Counted in PROFILE units, not by walking geometry.** Each section's content node carries the
 * `catalogPath` it was instantiated from; that path is looked up in the same option list the budget
 * was spent against. Counting real nodes instead would drift from the ledger — a shelves stack's
 * shelf components are empty COMPARTMENTS while the boards are `freeBoxContainerInteriorPart`s, so
 * "5 shelves" in a profile and "5 shelf nodes" in the tree are not the same number. Recovering the
 * spend in the unit it was spent in keeps the arithmetic exact.
 *
 * A section whose content path is not in `options` contributes nothing and is reported: it is
 * content the auto-fill did not place (a manual swap, or an option removed from the file since),
 * so the ledger genuinely cannot price it.
 */
const countSystemPiecesUsed = (core, systemId, options, { excludeItemIds = [] } = {}) => {
    const pieces = emptyPieceCounts();
    const unpricedPaths = [];
    const excluded = new Set(excludeItemIds);
    const profileByPath = new Map(options.map((option) => [option.path, option]));
    for (const itemId of getNodesBySystem(core, systemId)) {
        if (excluded.has(itemId))
            continue;
        const item = getOptionalNode(core, itemId);
        if (!item || item.type !== NodeType.Item)
            continue;
        // `sections` only exists on a multiCloset Item; `getNodesBySystem` already guarantees that.
        const sectionIds = item.sections?.get() ?? [];
        for (const sectionId of sectionIds) {
            const section = getOptionalNode(core, sectionId);
            if (!section || section.type !== NodeType.Part)
                continue;
            const contentIds = section.content?.get() ?? [];
            for (const contentId of contentIds) {
                const content = getOptionalNode(core, contentId);
                if (!content)
                    continue;
                const path = String(getPropertyValue(content, 'catalogPath') || '');
                const profile = path ? profileByPath.get(path) : undefined;
                if (!profile) {
                    if (path)
                        unpricedPaths.push(path);
                    continue;
                }
                for (const category of Object.values(MultiClosetComponentType))
                    pieces[category] += profile[category];
            }
        }
    }
    return { pieces, unpricedPaths };
};

export { countSystemPiecesUsed };
