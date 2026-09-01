import { ItemCalculation, ProjectCalculation, ProjectCalculationSummary } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Port of moon-vesta `getCalculationOnUpdateProject` — the aggregate transform.
 *
 * 1. strip each item's `calculations` list;
 * 2. roll every category up into a per-material `{ quantity }` map (`quantityOf`
 *    keeps the exact vesta math: area / width / width*height / unit / width-or-one);
 * 3. merge styled-door `parts` into `panels` (door-style materials only), then
 *    drop `parts`;
 * 4. fold `toeKicks` / `topValances` / `bottomValances` quantities into `panels`,
 *    then empty them.
 *
 * Door-style detection uses the same materials `doorStyle` table vesta read via
 * `Storage.get('materials').obj.doorStyle`, here `core.storage.get('materials')`
 * (null-guarded — tests may leave storage empty).
 */
export declare const aggregateProjectCalculation: (core: CoreDesigner, grouped: {
    perItem: ItemCalculation[];
    perProject: ProjectCalculation;
}) => {
    perItem: Omit<ItemCalculation, "calculations">[];
    perProject: ProjectCalculationSummary;
};
