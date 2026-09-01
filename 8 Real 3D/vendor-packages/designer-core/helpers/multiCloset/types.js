/**
 * MultiCloset section calculation — shared types.
 *
 * The engine is intentionally split into small, single-responsibility helpers
 * (see `sectionRules/`) so every business rule from the section-forming spec is
 * one tiny, independently testable function. These types are the contracts that
 * glue them together; nothing here performs any rule logic.
 */
const DEFAULT_SECTION_CALC_CONFIG = {
    widths: { widest: 42, standard: 30, narrow: 24, drawerMax: 30 },
    panelThickness: 0.75,
    minSectionWidth: 12,
    maxSectionWidth: 42,
    roundingStep: 0.125,
    maxBalanceDelta: 5
};

export { DEFAULT_SECTION_CALC_CONFIG };
