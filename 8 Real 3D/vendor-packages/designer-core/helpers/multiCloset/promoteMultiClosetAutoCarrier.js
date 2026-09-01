import { getResizeAbsorberCommands, collectSectionAutoStates, collectStackAutoStates, collectOpeningAutoStates } from '../../components/Node/helpers/getResizableSides.js';

const NO_ABSORBER = { kind: 'none' };
/**
 * Nearest-first candidates for the unlock tier: the survivors BEFORE the removal, walking
 * outwards from it, then the ones after. "Before" comes first because the child preceding the
 * deleted one is its visual neighbour — it grows into the freed space, so nothing else moves.
 * With no removal (a repair pass) the anchor is the end of the list, which degenerates to
 * "last survivor first".
 */
const unlockCandidatesNearestFirst = (siblings, removedIds) => {
    const removedIndices = siblings
        .map((sibling, i) => (removedIds.includes(sibling.id) ? i : -1))
        .filter((i) => i >= 0);
    const anchor = removedIndices.length > 0 ? Math.min(...removedIndices) : siblings.length;
    const survivors = (from, to) => siblings.slice(from, to).filter((sibling) => !removedIds.includes(sibling.id));
    return [...survivors(0, anchor).reverse(), ...survivors(anchor, siblings.length)];
};
/**
 * Who carries `isAutoSized` once `removedIds` are gone, and what has to be written to them, so the
 * family keeps at least one auto-sized member. LEVEL-AGNOSTIC: sections, stacks and openings all
 * fail the same way without it, and all three are repaired by the same decision.
 *
 * Why the invariant exists, per level:
 *   - sections — `updateMultiClosetItemLayoutEffect` only stretches an auto-sized section, so with
 *     none the leftover width is never handed out and the closet ends in a dead gap;
 *   - stacks / openings — `layoutMultiClosetFreeBoxContainer` / `tileStackBands` hand the leftover
 *     32mm holes to `splitHoles`, which returns `[]` for `autoCount === 0`: every unclaimed hole is
 *     silently DROPPED, so the column stops filling its section and stops re-fitting when the
 *     height changes.
 *
 * The answer speaks the resize chain's vocabulary ({@link ResizeAbsorberResolution}), so the same
 * `getResizeAbsorberCommands` performs the write for a drag and for a structural change.
 *
 * `siblings` are in layout order (sections left-to-right, stacks / openings bottom-to-top):
 *   1. some REMAINING sibling is already auto-sized → `existing-auto`, nothing to write;
 *   2. else the LAST remaining UNLOCKED sibling that can carry it → `promote`. Last, so the slack
 *      lands at the far end (the rightmost section, the topmost stack / opening) and no divider
 *      below it moves — the same choice `pickStackAutoCarrier` makes for a drag;
 *   3. else — every survivor is locked — the nearest LOCKED survivor before the removal (see
 *      {@link unlockCandidatesNearestFirst}) → `unlock-promote`: the lock is cleared AND the flag
 *      set, so that child rebalances its container instead of a gap being left behind. Gated by
 *      `allowUnlock` (default `true`) — the resize chain's flag, same meaning: only a deliberate
 *      user action may break a lock. Today only sections carry a user-facing lock, so for stacks
 *      and openings this tier is inert;
 *   4. else → `none`: nothing can carry auto-fit (empty family, or no survivor's catalog shell
 *      declares `isAutoSized` at all).
 *
 * One deliberate difference from the resize-drag chain (`resolveResizeAbsorber` /
 * `pickStackAutoCarrier`), which answers the same question for a GESTURE: a removal has no drag
 * direction, so tier 2 is "last" rather than "nearest on the grabbed side", and a removed id is
 * never picked — whereas a drag may hand the flag back to the very child it is pinning.
 * Pure — unit-tested.
 */
const pickMultiClosetAutoCarrier = (siblings, removedIds, { allowUnlock = true } = {}) => {
    const remaining = siblings.filter((sibling) => !removedIds.includes(sibling.id));
    const existing = remaining.find((sibling) => sibling.isAutoSized && !sibling.isLocked);
    if (existing)
        return { kind: 'existing-auto', absorberId: existing.id };
    const promotable = remaining.filter((sibling) => sibling.canAutoSize && !sibling.isLocked);
    if (promotable.length > 0)
        return { kind: 'promote', absorberId: promotable[promotable.length - 1].id };
    if (allowUnlock) {
        const locked = unlockCandidatesNearestFirst(siblings, removedIds).find((sibling) => sibling.isLocked && sibling.canAutoSize);
        if (locked)
            return { kind: 'unlock-promote', absorberId: locked.id };
    }
    return NO_ABSORBER;
};
/**
 * The family of `containerId`, resolved from the container's own type — an `Item` owns sections, a
 * `FreeBoxContainer` owns stacks, a stack `Part` owns openings. `null` for anything else, so a
 * caller can hand over any parent id it happens to hold.
 */
const resolveMultiClosetAutoFamily = (core, containerId) => {
    const sections = collectSectionAutoStates(core, containerId);
    if (sections)
        return { level: 'sections', siblings: sections };
    const stacks = collectStackAutoStates(core, containerId);
    if (stacks)
        return { level: 'stacks', siblings: stacks };
    const openings = collectOpeningAutoStates(core, containerId);
    if (openings)
        return { level: 'openings', siblings: openings };
    return null;
};
/**
 * Builds the commands that re-arm the auto-sized child of `containerId` — for `removedIds` that are
 * about to be deleted, or (with an empty list) for a container whose flag was stripped by some
 * other write. Empty when no promotion is needed or possible; see
 * {@link pickMultiClosetAutoCarrier}.
 *
 * ONE call covers all three levels: pass the multiCloset `Item` when sections change, the
 * `FreeBoxContainer` when `bays` change, the stack `Part` when its openings change. Callers push
 * the result into the SAME transaction as the mutation that would otherwise leave the container
 * flex-less, so no frame renders with a dead gap and one undo restores everything — a broken lock
 * included. The writes go through the resize chain's `getResizeAbsorberCommands`, so `promote` /
 * `unlock-promote` mean exactly what they mean for a resize drag (top-level `isAutoSized`, the
 * Value the layout effects read; the unlock ordered before the flag).
 *
 * Pass `{ allowUnlock: false }` where breaking a lock would contradict the caller's own contract —
 * `applyMultiClosetSections` skips locked sections in every phase, so it must not unlock one here.
 *
 * Every unexpected input resolves to `[]` rather than throwing: callers sit on delete / drop / apply
 * paths, where a repair that cannot be computed must not take the whole operation down.
 */
const promoteMultiClosetAutoCarrier = (core, containerId, removedIds = [], options) => {
    const family = resolveMultiClosetAutoFamily(core, containerId);
    if (!family)
        return [];
    return getResizeAbsorberCommands(core, pickMultiClosetAutoCarrier(family.siblings, removedIds, options));
};

export { promoteMultiClosetAutoCarrier as default, pickMultiClosetAutoCarrier, promoteMultiClosetAutoCarrier, resolveMultiClosetAutoFamily };
