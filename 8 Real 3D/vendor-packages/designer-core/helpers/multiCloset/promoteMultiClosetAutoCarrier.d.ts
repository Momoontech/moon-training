import { Command } from '../../components/commands/core/Command';
import { type ResizeAbsorberOptions, type ResizeAbsorberResolution, type ResizeSiblingState } from '../../components/Node/helpers/getResizableSides';
import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * The three levels of a multiCloset that must each keep an auto-sized child, named by the
 * container whose children they are:
 *   - `sections`  — an `Item`'s `sections`: the balance / cut-to-fit section absorbs leftover WIDTH;
 *   - `stacks`    — a `FreeBoxContainer`'s `bays`: an auto stack absorbs leftover HEIGHT (holes);
 *   - `openings`  — a stack's `children`: an auto opening (drawer / hanger / shelf compartment)
 *     absorbs the holes no fixed opening claimed.
 */
export type MultiClosetAutoLevel = 'sections' | 'stacks' | 'openings';
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
export declare const pickMultiClosetAutoCarrier: (siblings: ResizeSiblingState[], removedIds: UUID[], { allowUnlock }?: ResizeAbsorberOptions) => ResizeAbsorberResolution;
/**
 * The family of `containerId`, resolved from the container's own type — an `Item` owns sections, a
 * `FreeBoxContainer` owns stacks, a stack `Part` owns openings. `null` for anything else, so a
 * caller can hand over any parent id it happens to hold.
 */
export declare const resolveMultiClosetAutoFamily: (core: CoreDesigner, containerId: UUID) => {
    level: MultiClosetAutoLevel;
    siblings: ResizeSiblingState[];
} | null;
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
export declare const promoteMultiClosetAutoCarrier: (core: CoreDesigner, containerId: UUID, removedIds?: UUID[], options?: ResizeAbsorberOptions) => Command[];
export default promoteMultiClosetAutoCarrier;
