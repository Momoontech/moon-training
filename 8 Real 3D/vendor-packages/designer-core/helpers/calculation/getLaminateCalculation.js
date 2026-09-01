import { baseEntry } from './internal/entry.js';

/**
 * LaminateBox → `{ laminate }`.
 *
 * Surface area of the box's five faces from `size`, matching vesta's
 * `2*z*y + x*y + 2*x*z`. Core `LaminateBox` has no `materialId` (TODO(phase2):
 * source the laminate material from the parent box / materials set); with no
 * `materialId` the roll-up skips it.
 */
const getLaminateCalculation = (core, node) => {
    const x = node.size.x.get();
    const y = node.size.y.get();
    const z = node.size.z.get();
    return {
        laminate: {
            ...baseEntry(core, node),
            materialThickness: 0,
            grainDirection: 0,
            area: 2 * z * y + x * y + 2 * x * z
        }
    };
};

export { getLaminateCalculation };
