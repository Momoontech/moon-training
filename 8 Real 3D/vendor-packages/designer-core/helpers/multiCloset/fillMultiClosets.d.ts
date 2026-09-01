import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { SectionCalcConfig, SectionContentProfile, SectionPlan } from './types';
export interface FillMultiClosetsOptions {
    config?: SectionCalcConfig;
    /**
     * Whether the whole batch is recorded in undo/redo (default `false`). The fill
     * runs on a step switch, and `resetHistoryOnStepEffect` clears history on that
     * transition anyway, so the fill is intentionally non-history — undoing it (and
     * leaving `isGenerated` stranded) is never wanted.
     */
    addToHistory?: boolean;
    /**
     * Whether the fundamental-design allowance caps the layout (default `true`).
     *
     * The switch exists because the allowance describes what the BASE PRICE covers, which is not
     * always the same question as what may be built: `true` plans strictly inside it, `false` plans
     * purely from what the customer asked for and lets the quote carry any overage.
     *
     * Independent of the desire either way — the needs are read identically in both modes, so the
     * same system can be planned capped or uncapped without touching its `needs`.
     */
    limitToFundamentalDesign?: boolean;
    /**
     * Print the ordered-vs-delivered breakdown per system to the console (default `false`).
     *
     * Off by default because the breakdown costs real work on a path that runs on a step switch: the
     * per-closet `budgetBefore` snapshots exist only to be logged, so gathering them unconditionally
     * would charge every production fill two array allocations and a budget copy per closet, all
     * immediately garbage. Opting in keeps the tool available without paying for it.
     *
     * To read it while verifying generation against the expected-results table, pass
     * `{ diagnostics: true }` — or temporarily flip the default here, remembering that
     * `core.fillMultiClosets()` takes no options and so cannot request it. See `fillDiagnostics.ts`.
     */
    diagnostics?: boolean;
}
/** Why a pending closet produced no layout — surfaced per closet instead of a silent skip. */
export type FillMultiClosetSkipReason = 
/** The app never seeded `core.sectionOptions` (or seeded an empty list). */
'no-section-options' | 'no-system' | 'no-mapped-needs' | 'no-buildable-category';
/** Outcome for one closet touched by {@link fillMultiClosets}. */
export interface FillMultiClosetResult {
    itemId: UUID;
    /** The applied section plan, or `null` when the closet could not be planned. */
    plan: SectionPlan | null;
    /** Set when `plan` is `null` because the closet was skipped rather than planned. */
    skipReason?: FillMultiClosetSkipReason;
}
/**
 * Fill every not-yet-generated multiCloset in the project with a section layout, driven by the
 * NEEDS of the system each closet belongs to.
 *
 * `options` is the self-describing content-option list — and the CLOSED set of section types
 * auto-fill may use: a category no option carries is dropped from the desire before planning
 * (`restrictDesireToAvailableCategories`). It is passed IN rather than fetched here, because the
 * list is app-owned data behind an app-owned endpoint and `designer-core` owns no URLs
 * (CLAUDE.md rule 11 — platform capabilities are injected by the app). Consequently the whole
 * function is SYNCHRONOUS: there is no I/O left in it.
 *
 * This helper stays a PURE function of its arguments so tests and the per-closet toolbar path can
 * hand it any list. The app-facing seam is `CoreDesigner.fillMultiClosets()`, which supplies
 * `core.sectionOptions` (seeded once via `setSectionOptionsFromJSON`) — that is why the app calls
 * it with no arguments while this signature is explicit.
 *
 * The desire needs no input either: what the customer asked for lives in the system's `needs`
 * (see `systemNeeds.ts` for the name → category mapping and the "one need = one unit" rule).
 * There are no intensity sliders any more.
 *
 * **The desire is per SYSTEM, the generation is per ITEM.** Pending closets are grouped by their
 * owning system (`item.system`), the desire vector is resolved ONCE per system, and every closet
 * of that system is then planned against it in turn, each flipping its own `isGenerated`. So two
 * closets in one system are laid out to the same brief, while a closet in a different system
 * follows its own needs — and a closet added later is filled from the same system brief on the
 * next call, without re-touching its already-generated siblings.
 *
 * A closet is SKIPPED (scene untouched, `isGenerated` left `false`, so it stays retryable) when:
 *   - it carries no `system` — nothing says what to fill it with;
 *   - its system's needs map to no known category — including the "no needs at all" case;
 *   - every requested category was dropped for lack of a content option (see
 *     `restrictDesireToAvailableCategories`).
 * Each case is reported as a `skipReason` on the result AND logged, because "nothing happened"
 * is otherwise indistinguishable from "worked fine".
 *
 * The whole batch is applied under one root transaction and is non-history by default
 * (`addToHistory: false`): each per-closet apply and its `isGenerated` flip nest in with the same
 * flag, so the fill and the marker it writes always share one history behavior — undoing one could never strand the other. A closet is only marked
 * generated once its plan actually produced sections, so an empty plan stays retryable too.
 *
 * Returns one {@link FillMultiClosetResult} per pending closet — including the skipped ones.
 */
export declare const fillMultiClosets: (core: CoreDesigner, options: SectionContentProfile[], { config, addToHistory, limitToFundamentalDesign, diagnostics }?: FillMultiClosetsOptions) => FillMultiClosetResult[];
export default fillMultiClosets;
