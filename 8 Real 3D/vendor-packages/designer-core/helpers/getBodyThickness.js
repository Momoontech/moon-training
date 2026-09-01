import getOptionalParentItem from '../components/Node/helpers/getOptionalParentItem.js';
import getMaterialById from './getMaterialById.js';
import getMaterialsSetById from './getMaterialsSetById.js';

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
const getBodyThickness = (core, nodeId) => {
    const item = getOptionalParentItem(core, nodeId);
    if (!item)
        return 0;
    return getMaterialById(core, getMaterialsSetById(core, item.materialsSet.get()).body.get(), 'body').thickness;
};

export { getBodyThickness };
