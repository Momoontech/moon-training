import { CoreDesigner } from '..';
import { UUID } from '../declarations';
/**
 * Body-panel thickness (inches) for the closet that owns `nodeId` — the `t` in
 * the 32mm `step·N − t` grid openings. Resolves the enclosing multiCloset
 * `Item`, then its materials set's `body` material, exactly as the multiCloset
 * layout effects do (`updateMultiClosetFreeBoxContainerLayoutEffect` /
 * `applyStackBandsLayout`). Returns `0` when there is no enclosing Item.
 *
 * Barrel-exported so the UI layer (front-view grid resize) can compute the same
 * valid grid heights the layout effects lay out against, without reaching into
 * the default-only material helpers.
 */
export declare const getBodyThickness: (core: CoreDesigner, nodeId: UUID) => number;
export default getBodyThickness;
