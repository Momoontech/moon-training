import { SectionCalcConfig } from '../types';
/**
 * Rule: sections wider than the standard width are "slightly more expensive".
 * Lets the count step prefer fewer-but-wider sections only when that actually
 * reduces component count.
 */
export declare const isWideCostly: (width: number, config: SectionCalcConfig) => boolean;
export default isWideCostly;
