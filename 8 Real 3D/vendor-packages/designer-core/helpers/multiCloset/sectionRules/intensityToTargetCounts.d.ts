import { MultiClosetComponentType } from '../../../declarations';
import { MultiClosetStackNumbers } from '../types';
export type CategoryCounts = Record<MultiClosetComponentType, number>;
/**
 * Rule: map the three 0-5 desire sliders into per-category section counts that
 * sum to exactly `n`.
 *
 * Each category's desire (uniformly weighted) is normalized into a share of `n`
 * and floored, then leftover sections are handed out by largest fractional
 * remainder — but **only to categories with a non-zero intensity**, so a slider
 * set to 0 (e.g. drawers off) can never receive a section. Ties break by category
 * order; the all-zero case falls back to the first category.
 */
export declare const intensityToTargetCounts: (desired: MultiClosetStackNumbers, n: number) => CategoryCounts;
export default intensityToTargetCounts;
