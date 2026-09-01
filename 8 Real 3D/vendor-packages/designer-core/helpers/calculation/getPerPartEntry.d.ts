import { Node } from '../../components/Node';
import { PerPartCalculation } from '../../declarations/calculation';
import { CoreDesigner } from '../../designer-core';
/**
 * Builds a `perPart` entry for a qualifying closet Part/Panel/Molding — the
 * core analogue of vesta's `Part.getCalculation('perPart')`. Child components
 * are attached later by `getPerPartCalculations`; here we only produce the base
 * part with empty category arrays.
 */
export declare const getPerPartEntry: (core: CoreDesigner, node: Node) => PerPartCalculation;
