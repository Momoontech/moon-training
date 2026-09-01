import { MultiClosetStackNumbers, SectionCalcConfig } from '../types';
/**
 * Rule: "divide the space by the widest section available".
 *
 * Returns the widest preferred section width, clamped to the drawer max when any
 * drawers are desired (drawers cap out around 30"). This single function is the
 * one place to change the widest-first policy.
 */
export declare const getTargetSectionWidth: (desired: MultiClosetStackNumbers, config: SectionCalcConfig) => number;
export default getTargetSectionWidth;
