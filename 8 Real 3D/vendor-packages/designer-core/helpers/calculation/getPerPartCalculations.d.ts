import { UUID } from '../../declarations';
import { PerPartCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Vesta's `perPart` pass, reimplemented over core: for each closet item, walk
 * its subtree, select the qualifying parts (toe-kicks, fix-shelf dividers,
 * stacks, and carcass panels), and emit one entry each with its descendants'
 * BOM rolled into the entry's category arrays. Not grouped, not run through the
 * aggregate transform. Deduped by node id.
 */
export declare const getPerPartCalculations: (core: CoreDesigner, closetItemIds: UUID[]) => PerPartCalculation[];
