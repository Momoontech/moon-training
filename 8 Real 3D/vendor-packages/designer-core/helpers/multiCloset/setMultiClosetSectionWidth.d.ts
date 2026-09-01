import { Command } from '../../components/commands/core/Command';
import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
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
export declare const canSetMultiClosetSectionWidth: (core: CoreDesigner, itemId: UUID, sectionId: UUID) => boolean;
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
export declare const setMultiClosetSectionWidth: (core: CoreDesigner, itemId: UUID, sectionId: UUID, val: number) => Command | null;
export default setMultiClosetSectionWidth;
