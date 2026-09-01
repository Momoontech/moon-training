import SetValueCommand from '../../components/commands/SetValueCommand.js';
import getItem from '../../components/Node/helpers/getItem.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import { MultiClosetComponentType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getMonitor } from '../monitor.js';
import { applyMultiClosetSections } from './applyMultiClosetSections.js';
import getAllMultiClosets from './getAllMultiClosets.js';
import { countSystemPiecesUsed } from './countSystemPiecesUsed.js';
import { logFillDiagnostics } from './fillDiagnostics.js';
import { getFundamentalDesignAllowance, FUNDAMENTAL_DESIGN_FILLER_CATEGORY, FUNDAMENTAL_DESIGN_PIECES_PER_NEED } from './fundamentalDesign.js';
import { unlimitedPieceBudget, subtractPieceCountsFromBudget, emptyPieceCounts } from './sectionRules/pieceBudget.js';
import { restrictDesireToAvailableCategories } from './sectionRules/restrictDesireToAvailableCategories.js';
import { getClosetSystemId } from './systemStatus.js';
import { DEFAULT_SECTION_CALC_CONFIG } from './types.js';

/** Human-readable allowance for a log line; `∞` for the uncapped categories. */
const formatBudget = (budget) => Object.entries(budget)
    .map(([category, value]) => `${category}:${Number.isFinite(value) ? value : '∞'}`)
    .join(', ');
/** Human-readable desire vector for a log line. */
const formatDesire = (desire) => Object.entries(desire)
    .filter(([, value]) => value > 0)
    .map(([category, value]) => `${category}×${value}`)
    .join(', ') || '(none)';
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
const fillMultiClosets = (core, options, { config = DEFAULT_SECTION_CALC_CONFIG, addToHistory = false, limitToFundamentalDesign = true, diagnostics = false } = {}) => {
    const pending = getAllMultiClosets(core).filter((id) => !getItem(core, id).isGenerated?.get());
    if (pending.length === 0)
        return [];
    // Nothing can be built without a single option, and every category would be dropped anyway —
    // bail before touching the scene so the closets stay retryable once the list arrives. This is
    // the path an app that never seeded `core.sectionOptions` takes.
    //
    // `Array.isArray` rather than a bare `.length` check because the un-seeded / mis-called case
    // arrives as `undefined`, and reading `.length` off it throws a bare "Cannot read properties of
    // undefined" from inside core — a message that names neither the missing data nor who forgot it.
    //
    // Reported PER CLOSET rather than as a bare `[]`, so the caller's own return value distinguishes
    // "no options were supplied" from "no closet was pending". `getMonitor()` only fans out to
    // registered middlewares, so in a host that registers none the log is invisible and this result
    // is the only signal there is.
    if (!Array.isArray(options) || options.length === 0) {
        getMonitor().warn('fillMultiClosets: no section content options — scene left unchanged. The list is app-owned ' +
            'data; seed it once with core.setSectionOptionsFromJSON(...) before the fill runs.');
        return pending.map((itemId) => ({ itemId, plan: null, skipReason: 'no-section-options' }));
    }
    // Group by system FIRST so the needs lookup and the option-availability gate run once per
    // system rather than once per closet. Insertion order is preserved, so closets are still
    // processed in scene order within their system.
    const bySystem = new Map();
    const results = [];
    for (const itemId of pending) {
        const systemId = getClosetSystemId(core, itemId);
        if (!systemId) {
            getMonitor().warn(`fillMultiClosets: closet ${itemId} carries no system — nothing to fill it from.`);
            results.push({ itemId, plan: null, skipReason: 'no-system' });
            continue;
        }
        const siblings = bySystem.get(systemId);
        if (siblings)
            siblings.push(itemId);
        else
            bySystem.set(systemId, [itemId]);
    }
    const transaction = core.beginTransaction('Generate Multi Closets', addToHistory);
    try {
        for (const [systemId, itemIds] of bySystem) {
            // Needs → the fundamental-design allowance: a finite per-category TARGET (what the split
            // aims at) plus the CEILING that stops the order being over-fulfilled. Both come from one
            // editable place, `fundamentalDesign.ts`.
            const { target, budget: allowance, unmappedNeedNames, hasAnyNeed } = getFundamentalDesignAllowance(core, systemId);
            if (unmappedNeedNames.length > 0) {
                getMonitor().warn(`fillMultiClosets: system ${systemId} carries needs with no section category: ${unmappedNeedNames.join(', ')} — ignored.`);
            }
            if (!hasAnyNeed) {
                getMonitor().warn(`fillMultiClosets: system ${systemId} expresses no section needs — its closets are skipped.`);
                for (const itemId of itemIds)
                    results.push({ itemId, plan: null, skipReason: 'no-mapped-needs' });
                continue;
            }
            // Requirement: a section type absent from the options file may not be used. Checked once per
            // system, on the full order, so an unbuildable category is reported rather than silently
            // substituted. The per-closet aim below is restricted the same way.
            const { desired: buildableOrder, droppedCategories } = restrictDesireToAvailableCategories(target, options);
            if (droppedCategories.length > 0) {
                getMonitor().warn(`fillMultiClosets: system ${systemId} asked for ${droppedCategories.join(', ')}, but the content-option file offers no such section — dropped.`);
            }
            const isBuildable = Object.values(buildableOrder).some((value) => value > 0);
            if (!isBuildable) {
                getMonitor().warn(`fillMultiClosets: system ${systemId} has no buildable category left — its closets are skipped.`);
                for (const itemId of itemIds)
                    results.push({ itemId, plan: null, skipReason: 'no-buildable-category' });
                continue;
            }
            // ONE allowance per system, drawn down as its closets are generated in turn. THIS is what
            // "the limits are on the system, not the item" means: pull three Office Desk Systems onto the
            // scene and they share one entitlement — the first closet takes what it can, the rest get
            // what is still missing plus the free filler.
            //
            // The allowance is also reduced by what the system's ALREADY-GENERATED closets hold, so it
            // survives across calls. Generating one closet, then dragging out a second and generating
            // again, must land in the same place as generating both at once — the system is one system
            // whether or not it was filled in one go.
            const budget = limitToFundamentalDesign ? { ...allowance } : unlimitedPieceBudget();
            if (limitToFundamentalDesign) {
                const { pieces: alreadyUsed, unpricedPaths } = countSystemPiecesUsed(core, systemId, options, {
                    // The closets about to be filled are excluded: `applyMultiClosetSections` REPLACES their
                    // content, so whatever they hold now is not a spend that survives this call.
                    excludeItemIds: itemIds
                });
                subtractPieceCountsFromBudget(budget, alreadyUsed);
                if (unpricedPaths.length > 0) {
                    getMonitor().warn(`fillMultiClosets: system ${systemId} holds section content the option file cannot price: ` +
                        `${[...new Set(unpricedPaths)].join(', ')} — it does not count against the allowance.`);
                }
            }
            // The filler's share of the aim. Kept constant rather than drawn down, because the filler is
            // unbounded — it is the one category every closet may keep asking for.
            const fillerShare = buildableOrder[FUNDAMENTAL_DESIGN_FILLER_CATEGORY] ||
                FUNDAMENTAL_DESIGN_PIECES_PER_NEED[FUNDAMENTAL_DESIGN_FILLER_CATEGORY];
            getMonitor().debug(`fillMultiClosets: system ${systemId} order → ${formatDesire(buildableOrder)}; ` +
                `allowance → ${limitToFundamentalDesign ? formatBudget(budget) : 'unlimited (disabled)'}`);
            // Gathered only for the diagnostics block; see the `diagnostics` option.
            const systemResults = [];
            const budgetsBefore = [];
            for (const itemId of itemIds) {
                // Aim at what is still MISSING, not at the original order. The second closet of a system
                // must not re-attempt the whole brief: with the order already delivered, its remaining
                // aim is just the free filler, which is what turns it into "short hanging for the rest".
                // Restricted again so a remainder the option file cannot build is not aimed at either.
                const remainingAim = emptyPieceCounts();
                for (const category of Object.values(MultiClosetComponentType)) {
                    if (Number.isFinite(budget[category])) {
                        remainingAim[category] = Math.max(0, Math.min(budget[category], buildableOrder[category]));
                    }
                    else {
                        // Unbounded. Two different reasons, and they need different aims: the FILLER is always
                        // unbounded and keeps its constant share, while any OTHER category is unbounded only
                        // because the cap is switched off — and then the aim is simply the order, not the
                        // filler's share (which would flatten every category to the same number).
                        remainingAim[category] =
                            category === FUNDAMENTAL_DESIGN_FILLER_CATEGORY ? fillerShare : buildableOrder[category];
                    }
                }
                const { desired } = restrictDesireToAvailableCategories(remainingAim, options);
                if (diagnostics)
                    budgetsBefore.push({ ...budget });
                const plan = applyMultiClosetSections(core, itemId, desired, options, {
                    config,
                    addToHistory,
                    budget,
                    fillerCategory: FUNDAMENTAL_DESIGN_FILLER_CATEGORY
                });
                results.push({ itemId, plan });
                if (diagnostics)
                    systemResults.push({ itemId, plan });
                // Spend what this closet actually used, so the next closet of the SAME system plans against
                // the remainder. Read from the plan rather than recomputed here — the planner is the only
                // thing that knows which options it settled on after its own budget fallbacks.
                if (plan)
                    subtractPieceCountsFromBudget(budget, plan.piecesUsed);
                // Only mark generated when the plan actually filled the closet — leave a
                // no-op plan (no sections) retryable on the next call. The flip shares the
                // fill's `addToHistory`, so the two are never split across an undo.
                if (plan && plan.sections.length > 0) {
                    const isGenerated = getItem(core, itemId).isGenerated;
                    if (isGenerated) {
                        core.runCommandsAsTransaction([new SetValueCommand(isGenerated, true)], '', addToHistory);
                    }
                }
            }
            // Ordered-vs-delivered block per system (see `fillDiagnostics.ts`). Printed after the whole
            // system so the DELIVERED column is the sum across its closets, which is the level the
            // allowance is defined at.
            if (diagnostics) {
                const systemEntry = core.systemData.peek().find((entry) => entry?.id === systemId);
                logFillDiagnostics({
                    systemId,
                    systemName: systemEntry?.name,
                    needNames: (systemEntry?.needs ?? []).map((need) => need.name),
                    unmappedNeedNames,
                    target,
                    budget: allowance,
                    limitToFundamentalDesign,
                    closets: systemResults.map((entry, index) => ({ ...entry, budgetBefore: budgetsBefore[index] }))
                });
            }
        }
    }
    finally {
        transaction.end();
    }
    return results;
};

export { fillMultiClosets };
