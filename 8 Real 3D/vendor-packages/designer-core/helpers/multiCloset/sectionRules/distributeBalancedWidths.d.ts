import { SectionCalcConfig } from '../types';
export interface BalancedWidthResult {
    /** Floored width shared by every fixed (non-balance) section (in). */
    fixedWidth: number;
    /** Width of the single balance / CTF section (in) — absorbs the remainder. */
    balanceWidth: number;
    warnings: string[];
}
/**
 * Rule: one cut-to-fit balance section, the rest equal and floored to the grid.
 *
 * Instead of forcing every section to an identical non-grid width (e.g. 29.0833"),
 * we floor the equal split to `roundingStep` (0.125") for the `n - 1` fixed
 * sections and let the **last** section absorb whatever is left over — that is the
 * CTF section, cut on-site. Flooring makes the balance the widest, so when the gap
 * grows past `maxBalanceDelta` we nudge the fixed width up in grid steps (never
 * past the per-section `cap`) to pull the balance back toward the others.
 *
 * Pure: returns the two widths; placement (which slot is the balance) and the
 * per-section assignment live in `distributeSectionContents`.
 */
export declare const distributeBalancedWidths: (usable: number, n: number, hasDrawers: boolean, config: SectionCalcConfig) => BalancedWidthResult;
export default distributeBalancedWidths;
