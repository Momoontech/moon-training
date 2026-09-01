/**
 * MultiCloset section calculation — shared types.
 *
 * The engine is intentionally split into small, single-responsibility helpers
 * (see `sectionRules/`) so every business rule from the section-forming spec is
 * one tiny, independently testable function. These types are the contracts that
 * glue them together; nothing here performs any rule logic.
 */
import { MultiClosetComponentType } from '../../declarations';
/**
 * A per-category number bag, keyed by `MultiClosetComponentType` — the replacement for
 * the old free-standing `SectionCategory` union, so the planner and the scene graph now
 * name the categories identically and hanging is split into short / long.
 *
 * Used in two roles the engine keeps distinct:
 *
 *   - as a DESIRE vector, each entry is an intensity on a 0-5 scale (0 = none,
 *     5 = very high). These are desires, not exact counts — the engine maps them to a
 *     closest-fit layout, it does not guarantee a match;
 *   - as a PROFILE vector (see {@link SectionContentProfile}), each entry is the count
 *     of that category the option actually contains.
 *
 * Being a mapped type over the enum, adding a category is a compile error at every
 * literal that builds one of these bags.
 */
export type MultiClosetStackNumbers = {
    [key in MultiClosetComponentType]: number;
};
/**
 * A section-content option, authored directly in `multiClosetSectionOptions.json` as
 * `{ path, multiClosetShelfPart, multiClosetShortHangerPart, multiClosetLongHangerPart,
 * multiClosetDrawerPart }`. `path` is both the identity and the catalog path handed to
 * `CreateNodeFromCatalogCommand` when applying; the per-category counts are the
 * descriptive attributes the closest-fit matcher scores against. No catalog lookup is
 * involved — the option is self-describing, which also means the JSON must be re-keyed
 * whenever `MultiClosetComponentType` gains a member.
 */
export interface SectionContentProfile extends MultiClosetStackNumbers {
    path: string;
}
/**
 * Geometry / width tuning for the count step. Category weighting lives in the
 * priorities file (data), not here — this object only holds physical widths.
 */
export interface SectionCalcConfig {
    widths: {
        /** Widest preferred section width (in). "Divide by the widest" target. */
        widest: number;
        /** Standard width; sections wider than this are flagged costly. */
        standard: number;
        /** Narrow preferred width. */
        narrow: number;
        /** Max usable width for a section that contains drawers. */
        drawerMax: number;
    };
    /** Panel/separator thickness (in). N sections need N+1 panels. */
    panelThickness: number;
    /** Hard lower bound for a single section's inside width (in). */
    minSectionWidth: number;
    /** Hard upper bound for a single section's inside width (in). */
    maxSectionWidth: number;
    /**
     * Grid the fixed (non-balance) section widths snap to (in). Fixed sections are
     * floored to this increment; the balance section absorbs the remainder and is
     * cut on-site, so it is exempt.
     */
    roundingStep: number;
    /**
     * Max width gap (in) tolerated between the balance section and the equal fixed
     * sections. When flooring pushes the balance past this, the fixed width is
     * nudged up in `roundingStep` increments (respecting the width cap) to pull the
     * balance back toward the others.
     */
    maxBalanceDelta: number;
}
export declare const DEFAULT_SECTION_CALC_CONFIG: SectionCalcConfig;
/** One planned section in the computed layout. */
export interface PlannedSection {
    /** Catalog path to instantiate as the section content. */
    contentCatalogPath: string;
    /** Dominant category this slot was chosen to satisfy (informative). */
    category: MultiClosetComponentType;
    /**
     * Planned inside width (in). For fixed sections this is the floored equal
     * width that apply pins via `size.x`. For the balance section it is the
     * computed remainder — informative only, since apply leaves the balance
     * auto-sized so the layout effect recomputes it and absorbs the CTF remainder.
     */
    width: number;
    /**
     * The single cut-to-fit section (always the last, always non-drawer except the
     * degenerate single-drawer closet). Apply leaves it auto-sized; every other
     * section is pinned to its floored `width`.
     */
    isBalance: boolean;
}
/** Result of the pure calculation. */
export interface SectionPlan {
    sections: PlannedSection[];
    sectionCount: number;
    warnings: string[];
    /**
     * PIECES the planned sections add up to, per category — shelf boards, drawer boxes, rods, not
     * sections. Summed from the chosen options' profiles, so it is what a fundamental-design
     * allowance is drawn down by after this closet is applied (see `fundamentalDesign.ts`).
     */
    piecesUsed: MultiClosetStackNumbers;
}
