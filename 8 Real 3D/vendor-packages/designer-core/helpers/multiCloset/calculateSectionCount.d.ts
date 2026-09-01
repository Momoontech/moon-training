import { MultiClosetStackNumbers, SectionCalcConfig } from './types';
export interface SectionCountResult {
    count: number;
    /** Inside width left for all sections after CTF panels (in). */
    usable: number;
    warnings: string[];
}
/**
 * Width -> section count + usable inside width. A thin pipeline over the
 * single-rule helpers in `sectionRules/` — no business logic lives here, so each
 * rule stays independently editable and testable:
 *
 *   targetWidth = getTargetSectionWidth(desired)          (divide by widest)
 *   count       = getMinSectionCount(width, targetWidth)  (minimum sections)
 *               then clamp so panel-thickness usable width per section stays
 *               within [minSectionWidth, maxSectionWidth]
 *   usable      = applyPanelThickness(width, count)       (space net of panels)
 *
 * The width split itself (equal-floored fixed sections + one CTF balance) is
 * `distributeBalancedWidths`, applied later in `distributeSectionContents` once
 * the per-section categories — and thus the drawer width cap — are known.
 */
export declare const calculateSectionCount: (availableWidth: number, desired: MultiClosetStackNumbers, config?: SectionCalcConfig) => SectionCountResult;
export default calculateSectionCount;
