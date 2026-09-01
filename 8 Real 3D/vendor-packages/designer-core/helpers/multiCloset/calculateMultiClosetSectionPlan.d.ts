import type { MultiClosetComponentType } from '../../declarations';
import type { PieceBudget } from './sectionRules/pieceBudget';
import { MultiClosetStackNumbers, SectionCalcConfig, SectionContentProfile, SectionPlan } from './types';
export interface CalculateSectionPlanInput {
    /** Available inside width to fill (in). Already net of reserved neighbor space. */
    availableWidth: number;
    /** Desired intensity per category (0-5). */
    desired: MultiClosetStackNumbers;
    /** Parsed content options to choose from. */
    options: SectionContentProfile[];
    /** Width/geometry tuning (defaults applied if omitted). */
    config?: SectionCalcConfig;
    /**
     * Remaining fundamental-design allowance in PIECES for the system this closet belongs to.
     * Omitted = plan uncapped. Read-only here: the spend comes back as `SectionPlan.piecesUsed`.
     */
    budget?: PieceBudget;
    /** Category that absorbs slots the capped ones cannot pay for (see `fundamentalDesign.ts`). */
    fillerCategory?: MultiClosetComponentType;
}
/**
 * Pure top-level composer. Does no rule logic itself — it wires the count step
 * and the distribution step together and merges their warnings into a single
 * `SectionPlan`. Every rule lives in its own helper under `sectionRules/`, so
 * the section-forming behavior is adjustable one file at a time.
 */
export declare const calculateMultiClosetSectionPlan: ({ availableWidth, desired, options, config, budget, fillerCategory }: CalculateSectionPlanInput) => SectionPlan;
export default calculateMultiClosetSectionPlan;
