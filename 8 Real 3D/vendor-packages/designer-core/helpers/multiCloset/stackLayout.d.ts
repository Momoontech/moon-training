import type { Part } from '../../components/Node/components/Part';
import { type ResizeSiblingState } from '../../components/Node/helpers/getResizableSides';
import type { CoreDesigner } from '../../designer-core';
/** A child's resolved layout along the stacking (Y) axis. */
export interface StackChildLayout {
    /** Resulting `size.y`. */
    sizeY: number;
    /** Resulting `position.y` (stack-local, bottom-to-top). */
    posY: number;
}
/**
 * Split `totalHoles` into `count` whole-hole shares as equal as possible: every
 * share gets `floor(totalHoles / count)`, and the first `totalHoles % count` shares
 * get one extra hole. Returns `[]` for `count <= 0`.
 */
export declare const splitHoles: (totalHoles: number, count: number) => number[];
/** Total 32mm holes spanned by a stack of height `H = step·N − thickness` ⇒ `N`. */
export declare const stackHoleCount: (height: number, thickness: number, step: number) => number;
/** A stack ITEM (shelf compartment / drawer / hanger), reduced to what the auto-fit decision needs. */
export interface StackAutoItem<Id extends string = string> {
    /** The item node id, passed through so the caller can emit the command. */
    id: Id;
    /**
     * `true` when the part exposes an `isAutoSized` Value at all — only a catalog config that
     * declared the key creates one, so boards/dividers genuinely have none.
     */
    canAutoSize: boolean;
    /**
     * Current auto-fit state. Catalog values are the JS boolean `true` while commands write `1`,
     * so pass truthiness (`Boolean(part.isAutoSized?.get())`), never `=== 1`.
     */
    isAutoSized: boolean;
}
/**
 * Pick the item that must carry `isAutoSized` when `pinnedIds` are about to be pinned
 * (`isAutoSized = 0`), so the stack keeps at least one auto item.
 *
 * {@link tileStackBands} hands the leftover holes to {@link splitHoles}, which returns `[]` for
 * `autoCount === 0`: every hole no fixed item claimed is then silently DROPPED, leaving a dead gap
 * at the top of the stack (or an overflow), and the stack stops re-fitting when its height changes.
 * This is the invariant that prevents that. Generic across all three stack kinds — shelves, drawers
 * and hangers all go through the same band layout.
 *
 * `items` are in stack order (bottom-to-top), dividers excluded:
 *   1. some OTHER item is already auto-sized → `null`, the invariant already holds;
 *   2. else the LAST other item that can carry it — the TOPMOST, so later slack lands at the top of
 *      the stack and no divider below it moves;
 *   3. else the FIRST pinned item that can carry it — for a shelf-board drag
 *      (`pinnedIds = [below, above]`) that is the compartment BELOW the board, which stays auto and
 *      lets the layout walk derive its size;
 *   4. else `null` — no item in this stack can carry auto-fit at all.
 * Pure — unit-tested.
 */
export declare const pickStackAutoCarrier: <Id extends string>(items: StackAutoItem<Id>[], pinnedIds: Id[]) => Id | null;
/**
 * The stack's item openings as {@link StackAutoItem}s, in stack order (bottom-to-top) — what every
 * GESTURE feeds to {@link pickStackAutoCarrier}.
 *
 * A thin adapter over `collectOpeningAutoStates`, the openings collector the resize oracle and the
 * structural repair (`promoteMultiClosetAutoCarrier`) already share: one walk, one set of filters
 * (missing / `exists = 0` subtrees and divider parts skipped) for all three consumers, so the
 * carrier decision always matches what the layout walk lays out.
 *
 * Returns the collector's own `ResizeSiblingState` — a superset of {@link StackAutoItem} (it also
 * carries `isLocked`, which no stack-level rule reads yet), so it satisfies both
 * {@link pickStackAutoCarrier} (the gesture picker) and `pickMultiClosetAutoCarrier` (the
 * structural one) without a copy.
 */
export declare const collectStackAutoItems: (core: CoreDesigner, stack: Part) => ResizeSiblingState[];
/**
 * Stack interior layout — one unified model for **drawers, hangers, AND shelves**: children are
 * `M` item openings interleaved with `M−1` **real** fix-shelf divider parts (`item, divider,
 * item` … alternating, item-first and item-last). For drawers/hangers the item is the
 * drawer/hanger and the divider is a reveal separator; for shelves the item is the empty
 * compartment and the divider *is* the shelf board. The same 32mm walk serves all three.
 *
 * The walk is a plain **bottom-to-top, part-by-part** placement (no phantom gaps): a
 * divider occupies `thickness` and consumes no hole; an item occupies a clean 32mm
 * opening `step·N − thickness`:
 *   - auto items split the leftover holes maximally-but-not-perfectly equally
 *     (`splitHoles`),
 *   - non-auto items round their own `size.y` to the nearest hole count.
 * With the `M items ⇒ M−1 dividers` invariant the column tiles `H` exactly:
 * `Σ(step·Nᵢ − inset(i)) + (M−1)·thickness = step·N − thickness = H` (the item holes
 * `Nᵢ` sum to `totalHoles`). The divider children are baked into the stack catalog templates,
 * not created at runtime; this function only lays out whatever children exist.
 *
 * `itemInset(itemIndex, itemCount)` gives the amount an item's size is inset from `step·N`; it
 * defaults to `thickness` for every item (drawers/hangers — dividers centered on the hole). Shelves
 * pass a position-dependent inset (see {@link shelfCompartmentInset}) so their adjustable boards sit
 * bottom-to-hole. `itemIndex`/`itemCount` count **items only** (dividers are skipped).
 */
export declare const tileStackBands: (children: {
    isDivider?: boolean;
    isAutoSized: boolean;
    sizeY: number;
}[], height: number, thickness: number, step: number, itemInset?: (itemIndex: number, itemCount: number) => number) => StackChildLayout[];
/**
 * Compartment inset for an ADJUSTABLE-shelf stack (the `itemInset` passed to {@link tileStackBands}).
 * Adjustable shelves rest on pins and sit **bottom-to-hole**, so every board shifts up by half a
 * thickness vs the centered (drawer) tiling. Expressed per compartment as the inset from `step·N`:
 * the bottom compartment keeps `t/2`, interior compartments `t`, and the top compartment `1.5t`.
 * This still tiles `H` exactly (`Σ inset = M·t`, matching the `M−1` boards plus one `t`). A single
 * compartment (no boards) fills `H` with inset `t`, like a single drawer.
 */
export declare const shelfCompartmentInset: (itemIndex: number, itemCount: number, thickness: number) => number;
/**
 * FreeBoxContainer (multiCloset section column) layout. Children alternate
 * fix-shelf divider → stack → divider → … → divider (M stacks, M+1 dividers).
 * Fix shelves are `thickness`-thick dividers on the 32mm hole grid (holes at
 * `firstHoleOffset + step·k`); stacks are the openings, sized `step·N − thickness`.
 *
 * Bottom→top walk (stack top = next divider bottom; stack bottom = prev divider top):
 *   - first divider:  pos 0,                              size t
 *   - first stack:    pos t,                              size firstHoleOffset + step·s − 1.5t
 *   - later divider:  pos firstHoleOffset + step·prefix − 0.5t (centered on a hole), size t
 *   - later stack:    pos firstHoleOffset + step·prefix + 0.5t, size step·s − t
 *
 * Stack hole spans: fixed stacks consume `round((size+t)/step)` holes (the first
 * fixed stack `round((size − firstHoleOffset + 1.5t)/step)`); auto stacks split the
 * remaining budget `S_max = floor((height − firstHoleOffset − 0.5t)/step)` via
 * `splitHoles`. The leftover above the top divider is a sub-`step` top gap.
 */
export declare const layoutMultiClosetFreeBoxContainer: (children: {
    isStack: boolean;
    isAutoSized: boolean;
    sizeY: number;
}[], height: number, thickness: number, firstHoleOffset: number, step: number) => StackChildLayout[];
/** A `bays` child of a multiCloset FreeBoxContainer, classified for drop-insertion. */
export interface FreeBoxContainerBay {
    /** `true` for a stack (opening), `false` for a fix-shelf divider. */
    isStack: boolean;
    /** The child node id (passed through so the caller can resolve the anchor divider). */
    id: string;
    /** Current local `position.y` (bottom edge, bottom-to-top). */
    posY: number;
    /** Current local `size.y`. */
    sizeY: number;
}
/** Where a dragged stack should be inserted into a multiCloset FreeBoxContainer's `bays`. */
export interface BayInsertion {
    /** Index in the `bays` array at which to insert the dragged stack. */
    stackInsertIndex: number;
    /**
     * The fix-shelf divider the new stack is dropped next to; `null` when there are no
     * dividers. Informational — restoring the `divider, stack, divider` pattern is
     * {@link reconcileFreeBoxContainerBays}'s job, and it picks its own clone source
     * (the same "nearest divider, below first" rule) from the post-drop column.
     */
    anchorDividerId: string | null;
}
/**
 * Pick the insertion point for a stack dropped onto a multiCloset FreeBoxContainer.
 * The column is `divider, stack, divider, …, divider`; a stack is inserted just above
 * the divider nearest the pointer, but always **strictly between** the bottom and top
 * bracketing shelves. With no dividers the stack is simply appended. The shelf that
 * re-brackets the new stack is added afterwards by {@link reconcileFreeBoxContainerBays},
 * not here.
 *
 * `bays` must exclude the dragged stack, so the returned index addresses the column as it
 * will look once the stack has been detached — which is what `setParent` operates on.
 */
export declare const freeBoxContainerStackInsertion: (bays: FreeBoxContainerBay[], pointerY: number) => BayInsertion;
/** A `bays` child reduced to what {@link reconcileFreeBoxContainerBays} needs. */
export interface BayShape {
    id: string;
    isStack: boolean;
}
/** One divider {@link reconcileFreeBoxContainerBays} wants added back into a `bays` array. */
export interface BayDividerInsertion {
    /**
     * Index to insert at, relative to `orderedBayIds` (equivalently: the array after
     * `removeDividerIds` are gone and the reorder is applied). Apply the insertions in
     * DESCENDING `at` order so each index stays valid as the array grows.
     */
    at: number;
    /**
     * The surviving divider the new one should be cloned from — the nearest one to `at`,
     * preferring the shelf BELOW the gap (this is the old drop-time `anchorDividerId`, so a
     * new shelf inherits its neighbour's material / attributes rather than the column's
     * bottom-most shelf). `null` only when the column has no divider left to clone, in which
     * case the caller must fall back to the catalog template.
     */
    templateId: string | null;
}
/**
 * The structural repair {@link reconcileFreeBoxContainerBays} wants applied to a `bays` array.
 * Apply in this order: remove → reorder → insert (descending).
 */
export interface BayReconciliation {
    /** Surplus fix-shelf dividers to delete — only those left over after every gap was filled. */
    removeDividerIds: string[];
    /**
     * The exact `bays` array the column should hold once `removeDividerIds` are gone, using
     * EXISTING ids only. `null` when the surviving order is already correct.
     *
     * This is where a divider is **relocated** rather than destroyed and re-created: whenever a
     * run has a spare shelf and another run is short, the spare is moved instead. That keeps a
     * live drag preview free of node churn — the thing that makes a shelf visibly blink as the
     * dragged stack crosses a boundary.
     */
    orderedBayIds: string[] | null;
    /** Dividers to add back, ascending by `at`. Apply in DESCENDING order — see {@link BayDividerInsertion.at}. */
    insertions: BayDividerInsertion[];
}
/**
 * Restore the `divider, stack, divider, …, divider` alternation of a multiCloset
 * FreeBoxContainer's `bays`.
 *
 * The column is a run of fix-shelf dividers, then a stack, then a run, … — so `M` stacks
 * produce `M+1` divider runs, and each run must hold exactly ONE divider. The single
 * exception is the empty column (`M === 0`): its one run holds TWO dividers, the bottom
 * and top bracketing shelves. Hence the target count is `max(2, M + 1)` — which is also
 * why dropping the FIRST stack into an empty section adds no divider (0 and 1 stacks both
 * want 2), while every stack after that adds one.
 *
 * The first `wantPerRun` dividers already sitting in a run stay put, so the bottom and top
 * brackets survive any repair — mirroring the "never remove the first or last separator" rule
 * in `updateMultiClosetItemLayoutEffect`.
 *
 * **Relocate before create/destroy.** A run with a spare shelf donates it to a run that is
 * short (`orderedBayIds`), so only a genuine deficit creates a node and only a genuine surplus
 * deletes one. This matters because the drag preview reconciles on every pointermove: when the
 * dragged stack crosses a boundary the counts still match and only the ORDER changes, so
 * without this the same shelf would be destroyed and re-created frame after frame — which is
 * exactly what a blinking shelf looks like.
 *
 * Pure and idempotent: re-running against an already-valid column reports nothing to do, so
 * callers can invoke it unconditionally after any `bays` mutation.
 */
export declare const reconcileFreeBoxContainerBays: (bays: readonly BayShape[]) => BayReconciliation;
/**
 * Snap a plain (non-multiCloset) FreeBoxContainer interior part to the 32mm hole grid
 * along Y. Holes sit at `firstHoleOffset + step·k`; the part is centred on the hole
 * nearest `pointerY` and clamped so it stays fully within `[0, containerSizeY]`.
 * Mirrors the predecessor VESTA `calculateFreeMountPosition` hole loop. Returns the
 * part's `position.y` (bottom edge).
 */
export declare const snapTo32mm: (pointerY: number, partSizeY: number, containerSizeY: number, firstHoleOffset: number, step: number) => number;
/** Inputs for {@link stackResizeHeightOptions}. All lengths in the same scene unit (inches). */
export interface StackResizeOptionsInput {
    /** The FreeBoxContainer's interior height (`size.y`). */
    containerHeight: number;
    /** Grid origin — the bottom hole offset (carcass `FirstHoleOffset`). */
    firstHoleOffset: number;
    /** Fix-shelf (divider) board thickness — the `t` in `step·N − t`. */
    thickness: number;
    /**
     * Total 32mm holes reserved by the OTHER stacks in the same container — EXCLUDES the stack being
     * resized and the fix-shelf dividers (dividers sit on hole boundaries and consume no holes). The
     * caller computes it per stack (auto stacks reserve `minHolesPerStack`, fixed stacks their current
     * `stackHoleCount`), so no lossy height→hole conversion happens here.
     */
    otherStackHoles: number;
}
export declare const minHolesPerStack = 6;
export declare const minHolesPerStackPart = 3;
/**
 * Valid resize heights for one stack inside a multiCloset FreeBoxContainer — each a 32mm-grid
 * opening `step·N − thickness` (an `N`-hole opening bounded by a fix-shelf board).
 *
 * The hole budget is computed EXACTLY as `layoutMultiClosetFreeBoxContainer` allocates it, so the
 * offered sizes are precisely what fits — never one the layout would clip:
 *
 *     sMaxHoles = floor((containerHeight − firstHoleOffset − thickness/2) / step)   // total holes
 *     maxHoles  = sMaxHoles − otherStackHoles                                       // free holes for this stack
 *
 * The other stacks reserve `otherStackHoles`; the resized stack takes the remainder. Returns the
 * ascending heights for `N` from `minHolesPerStack` to `maxHoles` (empty when the remainder cannot
 * fit the stack at its minimum). Pure and unit-agnostic — directly unit-testable and reusable by any
 * resize UI / command.
 */
export declare const stackResizeHeightOptions: ({ containerHeight, firstHoleOffset, thickness, otherStackHoles }: StackResizeOptionsInput) => number[];
