import { CalculationCategory, NodeCalculation, ProjectCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Concatenate every node slice into project-level category arrays, assigning
 * each entry its owning item's `itemNumber`.
 *
 * Reworked from vesta: it read `getSceneObject(id).getItem().getConfig().itemNumber`;
 * core reads the number straight off the owning `Item`'s `properties` map (each
 * entry already carries `itemId`, resolved to the ancestor Item during generation).
 * The sort is numeric (`(a,b) => a-b`) rather than vesta's default lexicographic
 * sort, which mis-ordered `itemNumber` arrays once an item index reached ≥ 10.
 */
export declare const groupProjectCalculations: (core: CoreDesigner, perProject: NodeCalculation[], categories: CalculationCategory[]) => ProjectCalculation;
