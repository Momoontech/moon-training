import { MultiClosetComponentType } from '../../declarations';
import { type PieceBudget } from './sectionRules/pieceBudget';
import { MultiClosetStackNumbers, PlannedSection, SectionCalcConfig, SectionContentProfile } from './types';
export interface DistributeResult {
    sections: PlannedSection[];
    warnings: string[];
    /** PIECES the chosen sections add up to, per category — what the caller draws its budget down by. */
    piecesUsed: MultiClosetStackNumbers;
}
/**
 * Distribute `count` sections across the categories from the desire vector, order them (drawers
 * centered, cuttable sections at the ends), pick the closest-matching AFFORDABLE content option per
 * slot, and size them (equal-floored fixed sections + one CTF balance).
 *
 * Two ordering guarantees from the spec:
 *  - The LAST section is the cut-to-fit balance and must be non-drawer. When the
 *    user asks for drawers only (and there is room for >1 section) we inject a
 *    shelves balance at the end; a single-section drawers-only closet is the one
 *    allowed exception and keeps its drawer.
 *  - `usable` (from `calculateSectionCount`) is the inside width net of panels;
 *    `distributeBalancedWidths` splits it into the fixed width + balance width.
 *
 * **The piece budget (fundamental design).** `budget` caps how many PIECES each category may
 * contribute in total — shelf boards and drawer boxes, not sections. It is consumed slot by slot,
 * so a section's incidental pieces count too (a shelves option carrying 3 drawers spends drawer
 * budget).
 *
 * A slot whose planned category can no longer be afforded becomes the FILLER category instead
 * (`fillerCategory`, short hanging by default). The filler is the category the base price covers
 * without limit, so it can always absorb the remainder — which is what keeps a closet fully
 * sectioned once its capped categories are spent, instead of dropping slots and leaving the
 * geometry to stretch. A slot is only dropped when even the filler has no option in the file.
 *
 * Omit `budget` (or pass an unlimited one) to plan uncapped.
 *
 * PURE with respect to `budget`: it works on a local copy and reports the spend as `piecesUsed`,
 * leaving the caller to draw down the system-level allowance. Widths are computed from the FINAL
 * section list, so a budget-forced drop resizes the closet correctly instead of leaving a gap.
 */
export declare const distributeSectionContents: (count: number, usable: number, desired: MultiClosetStackNumbers, profiles: SectionContentProfile[], config: SectionCalcConfig, budget?: PieceBudget, fillerCategory?: MultiClosetComponentType) => DistributeResult;
export default distributeSectionContents;
