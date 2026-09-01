import { InterpretedValue } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { ValueOptionsType } from '../Value';
/**
 * Function to evaluate an interpreted value array and return the computed result.
 * @param arr - The interpreted value array to evaluate.
 * @param core - The CoreDesigner instance.
 * @param options - Additional options for evaluation.
 * @returns The computed result of the interpreted value.
 */
export declare const calculateArray: <T>(arr: InterpretedValue, core: CoreDesigner, options: ValueOptionsType) => T;
