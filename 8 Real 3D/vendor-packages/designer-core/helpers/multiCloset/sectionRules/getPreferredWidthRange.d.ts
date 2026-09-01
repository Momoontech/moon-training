import { MultiClosetComponentType } from '../../../declarations';
import { SectionCalcConfig } from '../types';
export interface WidthRange {
    min: number;
    max: number;
}
/**
 * Rule: preferred width window per content category.
 *  - hangers: 18-42" (LH 18-30", DH 30-42")
 *  - shelves: 24/30/42" -> 24-42"
 *  - drawers: 24/30"     -> 24-drawerMax"
 * Pure lookup against the configured widths, trivial to retune.
 */
export declare const getPreferredWidthRange: (category: MultiClosetComponentType, config: SectionCalcConfig) => WidthRange;
export default getPreferredWidthRange;
