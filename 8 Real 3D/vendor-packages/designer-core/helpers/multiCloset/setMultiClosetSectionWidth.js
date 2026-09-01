import SetNodeVectorComponentCommand from '../../components/commands/SetNodeVectorComponentCommand.js';
import getItem from '../../components/Node/helpers/getItem.js';
import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import getPart from '../../components/Node/helpers/getPart.js';
import { getEffectiveContentLocked } from '../../components/Node/helpers/getResizableSides.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../declarations/helpers.js';
import { VectorProps, V3Axes } from '../../declarations/InterpretedLine.js';
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
import { DEFAULT_SECTION_CALC_CONFIG } from './types.js';

/**
 * Is this section's width TYPEABLE at all — the value-independent half of
 * {@link setMultiClosetSectionWidth}'s guards, extracted so a details-panel field can be
 * disabled by the SAME predicate that would otherwise silently reject the typed number.
 *
 * Deliberately NOT `getResizableSides(...).left || .right`: the oracle's width answer includes
 * the drag-only move "pin the grabbed section and promote a neighbour to balance", which a typed
 * width does not implement — so it reports the balance section's edges as grabbable while this
 * write path refuses it. Handles and inputs are different capabilities; each has its own door.
 *
 * `false` when: the node is not a multiCloset Item's section, the section is locked (the lock
 * cascade), or it IS the auto-sized balance section (its width is computed, not set). Every read
 * is signal-tracked, so a consuming computed re-runs when the lock or the flags flip.
 */
const canSetMultiClosetSectionWidth = (core, itemId, sectionId) => {
    const item = getOptionalNode(core, itemId);
    if (item?.type !== NodeType.Item || item.itemType.get() !== ItemType.multiCloset)
        return false;
    if (!item.sections.get().includes(sectionId))
        return false;
    // The lock cascade: a locked section refuses every width edit — same predicate the resize
    // handles and drag gates consult, so the typed input can never do what the handles forbid.
    if (getEffectiveContentLocked(core, sectionId))
        return false;
    const section = getOptionalNode(core, sectionId);
    if (section?.type !== NodeType.Part)
        return false;
    // The balance section is auto-sized by the layout effect — not user-settable.
    return !(section.isAutoSized?.get() ?? 0);
};
/**
 * Builds a command that sets a multiCloset section's along-wall width
 * (`size.x`), or returns `null` when the edit is invalid.
 *
 * Only the `size.x` of the targeted section is written — `updateMultiClosetItemLayoutEffect`
 * ([packages/designer-core/src/components/Node/helpers/effects.ts](packages/designer-core/src/components/Node/helpers/effects.ts))
 * then reflows every child's position and absorbs the delta into the single
 * auto-sized "balance" section, keeping the closet's overall width unchanged.
 * This mirrors the `SetNodeVectorComponentCommand(section, size, x, …)` the
 * `applyMultiClosetSections` Phase-C sizing already emits, so editing a width
 * here and recomputing the plan share one mutation channel and one undo entry.
 *
 * Rejections (returns `null`, leaving the signal untouched so a controlled
 * input reads back the unchanged value):
 *   - non-positive / non-finite value, or below `minSectionWidth`;
 *   - anything {@link canSetMultiClosetSectionWidth} refuses — not a section of this
 *     multiCloset, a LOCKED section (the lock cascade), or the auto-sized balance section
 *     itself. Shared with the field-enable read, so a disabled input and a rejected write
 *     can never disagree;
 *   - a growth that would shrink the balance section below `minSectionWidth`.
 */
const setMultiClosetSectionWidth = (core, itemId, sectionId, val) => {
    const minWidth = DEFAULT_SECTION_CALC_CONFIG.minSectionWidth;
    if (!Number.isFinite(val) || val < minWidth)
        return null;
    // The value-independent guards (multiCloset membership, lock cascade, balance section) — the
    // same predicate the details-panel field-enable read uses. Past it, `itemId` IS a multiCloset
    // Item and `sectionId` IS one of its sections, so the lookups below cannot throw.
    if (!canSetMultiClosetSectionWidth(core, itemId, sectionId))
        return null;
    const sectionIds = getItem(core, itemId).sections.get();
    const section = getPart(core, sectionId);
    const currentWidth = section.size.x.get();
    const delta = val - currentWidth;
    // Growing a fixed section steals width from the single auto-sized balance
    // section, which must stay at or above the minimum. With no balance section
    // there is nowhere for the extra width to come from, so growth is refused.
    if (delta > 0) {
        let balanceHeadroom = null;
        for (const id of sectionIds) {
            const candidate = getPart(core, id);
            if (candidate.isAutoSized?.get() ?? 0) {
                balanceHeadroom = candidate.size.x.get() - minWidth;
                break;
            }
        }
        if (balanceHeadroom === null || delta > balanceHeadroom)
            return null;
    }
    return new SetNodeVectorComponentCommand(sectionId, VectorProps.size, V3Axes.x, val);
};

export { canSetMultiClosetSectionWidth, setMultiClosetSectionWidth };
