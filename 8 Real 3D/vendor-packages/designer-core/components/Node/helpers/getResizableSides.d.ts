import { UUID } from '../../../declarations';
import type { CoreDesigner } from '../../../designer-core';
import type { Command } from '../../commands/core/Command';
/**
 * THE resize-capability oracle: give it a node id, get back all four sides the node can be
 * resized from. TEMPLATE-DRIVEN: every node kind is described by one {@link ResizeBehavior}
 * row in {@link RESIZE_BEHAVIORS} — the generic engine reads the row and produces the answer,
 * so the differences between kinds are DATA in one table, not logic spread across functions:
 *
 *   kind      | width rule   | height rule      | depth rule
 *   ----------|--------------|------------------|------------
 *   section   | flex-chain   | anchored-bottom  | both-edges
 *   stack     | none         | side-neighbor    | none
 *   opening   | none         | any-sibling      | none
 *
 * LOCK CASCADE (engine-level, before any row is consulted): a locked SECTION freezes its entire
 * subtree — the section itself, its stacks, and their openings all answer all-false. Resolved by
 * walking up to the nearest enclosing section (the node itself when it IS one), so children need
 * no lock flag of their own and unlock restores everything at once.
 *
 * The width rule (self-contained, written from the agreed spec — no dependency on the
 * absorber module):
 *   1. a FLEX sibling (`isAutoSized` and not locked) on that side absorbs → resizable;
 *   2. otherwise, ONLY when this node is the LAST flex one in its family may it recruit:
 *      the nearest pinned sibling on that side, else the nearest locked one (unlock tier);
 *   3. anything else → that side is dead. A locked node never resizes at all.
 *
 * Height rules: `anchored-bottom` = sits on the closet floor, top edge only;
 * `side-neighbor` = an edge works iff a sibling exists on THAT side (stacks against the
 * section floor/ceiling); `any-sibling` = both edges work iff someone exists to trade
 * 32mm holes with (openings are side-blind — the carrier can sit anywhere).
 * Depth rules (floor plan): `both-edges` or `none`.
 *
 * `verticalAxis` names what the CALLER's vertical handles mean — `'height'` in the wall view,
 * `'depth'` in the top-down floor plan (same vocabulary as `useSectionResize`).
 *
 * Adding a Part kind = one new row + one sibling accessor. The closet Item itself would also
 * need the engine's Part-only guard widened (see {@link resolveResizeContext}) — one file either way.
 * Read-only and reactive: every read is signal-tracked, so consuming computeds re-run when
 * the answer changes.
 */
export interface ResizableSides {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
}
/** What the caller's vertical handles mean: wall view = `'height'`, floor plan = `'depth'`. */
export type ResizeVerticalAxis = 'height' | 'depth';
/**
 * A same-level sibling reduced to what the rules read (the dragged node itself included).
 * Exported because it is also the input of the flex/balance decisions OUTSIDE a resize gesture
 * (`pickMultiClosetAutoCarrier`), so the state extraction stays shared.
 */
export interface ResizeSiblingState {
    id: UUID;
    isAutoSized: boolean;
    isLocked: boolean;
    /** The catalog shell declared `isAutoSized` at all — only such nodes can ever flex. */
    canAutoSize: boolean;
}
/** What the width rule decided, and which flags the absorber needs flipped. */
export type ResizeAbsorberResolution = {
    kind: 'existing-auto';
    absorberId: UUID;
} | {
    kind: 'promote';
    absorberId: UUID;
} | {
    kind: 'unlock-promote';
    absorberId: UUID;
} | {
    kind: 'none';
};
export interface ResizeAbsorberOptions {
    /**
     * Last-resort policy: may the chain break the nearest lock (visibly, undoably) when the whole
     * drag side is locked? Defaults to `true` — the user's gesture wins, and the unlock runs inside
     * the same transaction. Pass `false` for strict semantics (the edge stays dead instead).
     *
     * CAUTION: {@link getResizableSides} always evaluates with the default (`true`) — a gesture
     * passing `false` would render a handle whose drag then resolves to `none`. If a strict-policy
     * caller ever appears, both doors must move to the same policy together.
     */
    allowUnlock?: boolean;
}
/**
 * Public form of the lock cascade, for every interaction that is not an edge-resize handle
 * (shelf-board MOVE handle, drag gates, drop targets, bulk operations, typed inputs): `true`
 * when `nodeId` sits inside a locked section (or is one) — the node is EFFECTIVELY locked.
 * Works for ANY node type (Parts, FreeBoxContainers, wrappers — the walk stops at the owning
 * Item, so an Item itself is never locked). Named after the `getEffective*Locked` floorplan
 * lock family. The exact walk the engine applies before any behavior row — so every
 * interaction freezes and revives together with the resize handles.
 */
export declare const getEffectiveContentLocked: (core: CoreDesigner, nodeId: UUID) => boolean;
/**
 * The SECTION family of a multiCloset, in `item.sections` order. `itemId` may be any node id:
 * anything that is not a multiCloset Item answers `null`.
 */
export declare const collectSectionAutoStates: (core: CoreDesigner, itemId: UUID) => ResizeSiblingState[] | null;
/**
 * The STACK family of a multiCloset FreeBoxContainer's `bays`, bottom-to-top (dividers skipped).
 * `fbcId` may be any node id; anything that is not a FreeBoxContainer answers `null`.
 */
export declare const collectStackAutoStates: (core: CoreDesigner, fbcId: UUID) => ResizeSiblingState[] | null;
/**
 * The item-OPENING family of a stack, bottom-to-top (dividers and non-existing subtrees skipped —
 * the same filter the stack layout walk applies, so the auto-fit decision always matches what is
 * actually laid out). `stackId` may be any node id; anything that is not a stack Part answers
 * `null`.
 */
export declare const collectOpeningAutoStates: (core: CoreDesigner, stackId: UUID) => ResizeSiblingState[] | null;
/**
 * All sides `nodeId` can be resized from. The single entry every handle-visibility check and
 * every resize gesture should consult — change a rule (or a table row) here, and every
 * consumer follows.
 */
export declare const getResizableSides: (core: CoreDesigner, nodeId: UUID, verticalAxis?: ResizeVerticalAxis) => ResizableSides;
/**
 * Resolve the width-drag absorber for `nodeId`'s `side` edge — the gesture-side twin of
 * {@link getResizableSides} (a side is visible exactly when this resolves to something; both
 * doors share {@link resolveResizeContext}). Only `'flex-chain'` width kinds (sections) resolve;
 * everything else, and anything inside a locked section, answers `none`.
 */
export declare const resolveResizeAbsorber: (core: CoreDesigner, nodeId: UUID, side: "left" | "right", options?: ResizeAbsorberOptions) => ResizeAbsorberResolution;
/**
 * The flag commands a resolution requires on the absorber — `promote` → `isAutoSized` 1;
 * `unlock-promote` → `isLocked` false THEN `isAutoSized` 1 (never a width change behind a shown
 * lock: the unlock precedes the flex). `existing-auto` / `none` need nothing. The resize gesture
 * runs these inside its open transaction, so ONE undo restores widths and flags (a broken lock
 * included) together.
 */
export declare const getResizeAbsorberCommands: (core: CoreDesigner, resolution: ResizeAbsorberResolution) => Command[];
