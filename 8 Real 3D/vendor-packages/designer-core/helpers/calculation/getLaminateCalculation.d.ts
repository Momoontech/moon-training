import { LaminateBox } from '../../components/Node/components/LaminateBox';
import { LaminateCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * LaminateBox → `{ laminate }`.
 *
 * Surface area of the box's five faces from `size`, matching vesta's
 * `2*z*y + x*y + 2*x*z`. Core `LaminateBox` has no `materialId` (TODO(phase2):
 * source the laminate material from the parent box / materials set); with no
 * `materialId` the roll-up skips it.
 */
export declare const getLaminateCalculation: (core: CoreDesigner, node: LaminateBox) => {
    laminate: LaminateCalculation;
};
