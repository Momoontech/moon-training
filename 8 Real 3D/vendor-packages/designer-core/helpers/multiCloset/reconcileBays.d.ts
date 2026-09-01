import type { Command } from '../../components/commands/core/Command';
import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Catalog template for a fix-shelf divider. Only reached when a column has no shelf left to
 * clone from — every ordinary repair duplicates a surviving neighbour instead, so the new
 * shelf inherits that column's material, width and attributes. Mirrors the hardcoded
 * separator path in `updateMultiClosetItemLayoutEffect`.
 */
export declare const FIX_SHELF_CATALOG_PATH = "master/Parts/General/fixShelfHorizontal";
/**
 * Overlays that project `bays` forward past mutations an EARLIER command in the same pack will
 * make. They exist so a caller can emit its own mutation and the repair as one atomic
 * transaction: one `batch()`, so the layout effect flushes once, with the final column. Building
 * the repair from the live column instead would need a second transaction — and the extra flush
 * in between renders the half-repaired shape, which is visible as a flickering shelf during a
 * drag.
 */
export interface ReconcileBaysOptions {
    /** Bay ids a `RemoveNodeCommand` earlier in the pack will delete (e.g. the stack being deleted). */
    pendingRemovals?: UUID[];
    /**
     * A bay a `SetNodeParentCommand` earlier in the pack will move into this column at `at`
     * (e.g. the stack being dragged). `at` indexes the column with that bay already detached —
     * the same convention `setParent` uses.
     */
    pendingInsert?: {
        id: UUID;
        at: number;
    };
}
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
export declare const reconcileFreeBoxContainerBaysCommands: (core: CoreDesigner, fbcId: UUID, options?: ReconcileBaysOptions) => Command[];
