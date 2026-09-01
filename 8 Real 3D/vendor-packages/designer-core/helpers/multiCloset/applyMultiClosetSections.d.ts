import { MultiClosetComponentType, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import type { PieceBudget } from './sectionRules/pieceBudget';
import { MultiClosetStackNumbers, SectionCalcConfig, SectionContentProfile, SectionPlan } from './types';
export interface ApplyMultiClosetSectionsOptions {
    config?: SectionCalcConfig;
    /** Whether the operation is recorded as an undo step (default true). */
    addToHistory?: boolean;
    /**
     * Remaining fundamental-design allowance in PIECES for the system this closet belongs to
     * (see `fundamentalDesign.ts`). Omitted = plan uncapped, which is what the single-closet
     * toolbar action does today.
     *
     * Read-only: the planner works on a copy and reports its spend as `SectionPlan.piecesUsed`, so
     * the CALLER decides how the allowance is drawn down across the system's closets.
     */
    budget?: PieceBudget;
    /**
     * Category that absorbs slots the capped ones can no longer pay for — short hanging by default
     * (`FUNDAMENTAL_DESIGN_FILLER_CATEGORY`), since the base price covers it without limit.
     */
    fillerCategory?: MultiClosetComponentType;
}
/**
 * Compute a section layout for the given multiCloset and apply it to the scene.
 *
 * Pure planning is delegated to `calculateMultiClosetSectionPlan`; this function
 * only diffs the plan against the live `sections` array and dispatches existing,
 * undoable commands across four phases: (A) reconcile the section COUNT,
 * (B) swap each section's CONTENT, (C) size the sections — fixed sections are
 * pinned to their floored width while the single balance section is left
 * auto-sized — and (D) guarantee that a balance section exists at all, which a
 * LOCKED section in the planned balance slot would otherwise deny. Separator
 * count, separator typing, and the balance width are then reconciled
 * automatically by `updateMultiClosetItemLayoutEffect`, which absorbs the CTF
 * remainder into the auto-sized balance section.
 *
 * The whole operation is wrapped in a single root transaction (one undo step),
 * and a throw in any phase aborts it — the scene never keeps a half-applied plan.
 * Each phase runs as a nested `runCommandsAsTransaction(..., '', true)`: the
 * nested pack still opens its own `batch`, so the layout effect flushes between
 * phases and the next phase reads fresh ids, while `addToHistory: true` lets the
 * child flatten its commands into the root (a nested transaction never pushes to
 * history on its own — only the root does). The root's `addToHistory` is the
 * single switch that decides whether the operation is undoable.
 *
 * `options` is the self-describing list of content choices
 * (`{ path, shelves, hangers, drawers }`); the counts drive closest-fit matching
 * and `path` is the catalog path instantiated for the chosen slot.
 *
 * Returns the computed `SectionPlan` (with any warnings), or `null` when the
 * target node is not a multiCloset. When the plan has no sections (e.g. no
 * content options supplied) the scene is left untouched.
 */
export declare const applyMultiClosetSections: (core: CoreDesigner, itemId: UUID, desired: MultiClosetStackNumbers, options: SectionContentProfile[], { config, addToHistory, budget, fillerCategory }?: ApplyMultiClosetSectionsOptions) => SectionPlan | null;
export default applyMultiClosetSections;
