import { calculateSectionCount } from './calculateSectionCount.js';
import distributeSectionContents from './distributeSectionContents.js';
import { DEFAULT_SECTION_CALC_CONFIG } from './types.js';

/**
 * Pure top-level composer. Does no rule logic itself — it wires the count step
 * and the distribution step together and merges their warnings into a single
 * `SectionPlan`. Every rule lives in its own helper under `sectionRules/`, so
 * the section-forming behavior is adjustable one file at a time.
 */
const calculateMultiClosetSectionPlan = ({ availableWidth, desired, options, config = DEFAULT_SECTION_CALC_CONFIG, budget, fillerCategory }) => {
    const { count, usable, warnings: countWarnings } = calculateSectionCount(availableWidth, desired, config);
    const { sections, warnings: distributeWarnings, piecesUsed } = distributeSectionContents(count, usable, desired, options, config, budget, fillerCategory);
    return {
        sections,
        // The width-derived target. `sections.length` is the truth once the budget has re-planned or
        // dropped a slot — `applyMultiClosetSections` sizes from `sections`, not from this.
        sectionCount: count,
        warnings: [...countWarnings, ...distributeWarnings],
        piecesUsed
    };
};

export { calculateMultiClosetSectionPlan, calculateMultiClosetSectionPlan as default };
