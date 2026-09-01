import { CalculationCategory, CategoryCalculations, NodeCalculation } from '../../declarations/calculation';
/**
 * Concatenate a set of per-node slices into one item's category arrays.
 * `edgebandings` slices hold arrays (flattened); every other category holds a
 * single entry. Pure — a 1:1 port of vesta's `groupItemCalculations`.
 */
export declare const groupItemCalculations: (slices: NodeCalculation[], categories: CalculationCategory[]) => CategoryCalculations;
