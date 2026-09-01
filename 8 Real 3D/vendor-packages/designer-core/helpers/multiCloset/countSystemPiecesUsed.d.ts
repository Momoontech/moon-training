import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import type { MultiClosetStackNumbers, SectionContentProfile } from './types';
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
export declare const countSystemPiecesUsed: (core: CoreDesigner, systemId: UUID, options: SectionContentProfile[], { excludeItemIds }?: {
    excludeItemIds?: UUID[];
}) => {
    pieces: MultiClosetStackNumbers;
    unpricedPaths: string[];
};
export default countSystemPiecesUsed;
