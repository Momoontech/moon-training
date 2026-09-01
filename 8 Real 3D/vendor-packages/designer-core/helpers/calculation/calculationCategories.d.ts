import { CalculationCategory, CategoryCalculations, ObjectCalculation } from '../../declarations/calculation';
/**
 * The 17 aggregation categories, in the same order vesta's transform iterated
 * them. Single source of truth for grouping + the per-material roll-up.
 */
export declare const CATEGORY_KEYS: CalculationCategory[];
/** A fresh, fully-seeded set of empty category arrays. */
export declare const emptyCategoryCalculations: () => CategoryCalculations;
/**
 * How a single calculation line contributes to its per-material quantity total.
 * Identical rules to moon-vesta `getCalculationOnUpdateProject` (area / width /
 * width*height / unit count / width-or-one).
 */
export declare const quantityOf: (key: CalculationCategory, entry: ObjectCalculation) => number;
