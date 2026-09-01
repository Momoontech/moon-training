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
import { distributeBalancedWidths } from './sectionRules/distributeBalancedWidths.js';
import { intensityToTargetCounts } from './sectionRules/intensityToTargetCounts.js';
import { emptyPieceCounts, consumeOptionFromBudget, addOptionToPieceCounts, unlimitedPieceBudget, optionFitsBudget } from './sectionRules/pieceBudget.js';
import { scoreOptionAgainstTarget } from './sectionRules/scoreOptionAgainstTarget.js';

/** Unit emphasis vector for a single category, used as the match target. */
const unitVector = (category) => ({
    [MultiClosetComponentType.multiClosetShelfPart]: category === MultiClosetComponentType.multiClosetShelfPart ? 1 : 0,
    [MultiClosetComponentType.multiClosetShortHangerPart]: category === MultiClosetComponentType.multiClosetShortHangerPart ? 1 : 0,
    [MultiClosetComponentType.multiClosetLongHangerPart]: category === MultiClosetComponentType.multiClosetLongHangerPart ? 1 : 0,
    [MultiClosetComponentType.multiClosetDrawerPart]: category === MultiClosetComponentType.multiClosetDrawerPart ? 1 : 0
});
/**
 * Pick the option that best matches a category emphasis AND still fits the piece budget.
 *
 * TWO hard filters run BEFORE scoring, and both matter:
 *
 *  - the option must actually CONTAIN the category (`profile[category] > 0`). Scoring alone is not
 *    enough: the metric returns the *nearest* profile, so a request for long hanging would happily
 *    come back with a short-hang option once it was the closest affordable one. The slot then kept
 *    the `long` label while holding short-hang content — a silently mislabelled section, and the
 *    "allowance reached" fallback never fired because a non-null option looked like success.
 *  - it must fit the budget. Affordability is a filter, not a tie-break: the fundamental design
 *    caps what the base price covers, so a closer-fitting but unaffordable option must lose to a
 *    worse-fitting affordable one.
 *
 * `null` when nothing satisfies both — the caller then hands the slot to the filler.
 */
const pickBestAffordableOption = (profiles, category, budget, preferredPieces = Number.POSITIVE_INFINITY) => {
    const target = unitVector(category);
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;
    let bestOvershoot = Number.POSITIVE_INFINITY;
    for (const profile of profiles) {
        if (profile[category] <= 0)
            continue;
        if (!optionFitsBudget(profile, budget))
            continue;
        const score = scoreOptionAgainstTarget(profile, target);
        // `scoreOptionAgainstTarget` compares DIRECTION only, so a 2-shelf and a 5-shelf option are
        // indistinguishable to it. Left alone, the tie falls to file order and the first shelf slot
        // eats the whole allowance. `preferredPieces` breaks it by size, which is what lets several
        // slots share one allowance instead of the first one starving the rest.
        const overshoot = Math.abs(profile[category] - preferredPieces);
        if (score < bestScore - 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && overshoot < bestOvershoot)) {
            bestScore = Math.min(score, bestScore);
            bestOvershoot = overshoot;
            best = profile;
        }
    }
    return best;
};
/** How many distinct options can build this category at all — the flexibility measure below. */
const countBuildableOptions = (profiles, category) => profiles.reduce((total, profile) => total + (profile[category] > 0 ? 1 : 0), 0);
/**
 * Build the left-to-right category order.
 *
 * Drawers are fixed boxes that cannot be trimmed, so they go in the **middle**;
 * shelves/hangers are cuttable and go at the **ends**. The non-drawer sections
 * are split toward both ends (`split_ends`), with the back half taking the extra
 * one on odd counts — guaranteeing the LAST slot is always non-drawer so it can
 * serve as the cut-to-fit balance:
 *
 *   1 non-drawer  -> [drawers…, nd]
 *   2 non-drawer  -> [nd, drawers…, nd]
 *   3 non-drawer  -> [nd, drawers…, nd, nd]
 */
const buildOrder = (shelves, shortHangers, longHangers, drawers) => {
    const nonDrawer = [
        ...new Array(shelves).fill(MultiClosetComponentType.multiClosetShelfPart),
        ...new Array(shortHangers).fill(MultiClosetComponentType.multiClosetShortHangerPart),
        ...new Array(longHangers).fill(MultiClosetComponentType.multiClosetLongHangerPart)
    ];
    const mid = Math.floor(nonDrawer.length / 2);
    return [
        ...nonDrawer.slice(0, mid),
        ...new Array(drawers).fill(MultiClosetComponentType.multiClosetDrawerPart),
        ...nonDrawer.slice(mid)
    ];
};
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
const distributeSectionContents = (count, usable, desired, profiles, config, budget = unlimitedPieceBudget(), fillerCategory = MultiClosetComponentType.multiClosetShortHangerPart) => {
    const warnings = [];
    const piecesUsed = emptyPieceCounts();
    if (count <= 0)
        return { sections: [], warnings, piecesUsed };
    if (profiles.length === 0) {
        warnings.push('No section content options available — cannot assign section content.');
        return { sections: [], warnings, piecesUsed };
    }
    const targetCounts = intensityToTargetCounts(desired, count);
    let { [MultiClosetComponentType.multiClosetShelfPart]: shelves, [MultiClosetComponentType.multiClosetShortHangerPart]: shortHangers, [MultiClosetComponentType.multiClosetLongHangerPart]: longHangers, [MultiClosetComponentType.multiClosetDrawerPart]: drawers } = targetCounts;
    // Guarantee a non-drawer (cuttable) balance section. The single-section
    // drawers-only closet is the allowed exception — it keeps its drawer.
    if (shelves + (shortHangers + longHangers) === 0 && count > 1) {
        shelves = 1;
        drawers = count - 1;
        warnings.push('Drawers-only request: added a shelves-only balance section at the end.');
    }
    const ordered = buildOrder(shelves, shortHangers, longHangers, drawers);
    // Slot assignment under the budget. A local copy so the caller's budget is untouched; the spend
    // is reported instead.
    const remaining = { ...budget };
    const assigned = new Array(ordered.length);
    const cappedCategories = new Set();
    /** Refused despite having budget left — blocked by some option's INCIDENTAL pieces, not its own. */
    const blockedWithBudgetLeft = new Set();
    // Which geometric slots belong to which category. `ordered` fixes WHERE a section sits; choosing
    // WHAT goes in it is position-independent, so the two are decoupled here.
    const slotsByCategory = new Map();
    ordered.forEach((category, index) => {
        const slots = slotsByCategory.get(category);
        if (slots)
            slots.push(index);
        else
            slotsByCategory.set(category, [index]);
    });
    // MOST-CONSTRAINED CATEGORY FIRST, not left-to-right.
    //
    // Options spend from several budgets at once, so allocation order decides who gets starved. With
    // the real catalog the only drawer section is "3 drawers + 3 shelves": served after the shelf
    // slots, the shelf allowance is already gone and the closet ends up with NO drawers at all — the
    // order silently under-delivered on a category that was explicitly asked for. Serving the
    // category with the fewest buildable options first gives the rigid one its pick while the
    // flexible ones can still adapt to what is left.
    const categoriesByScarcity = [...slotsByCategory.keys()].sort((a, b) => countBuildableOptions(profiles, a) - countBuildableOptions(profiles, b));
    for (const category of categoriesByScarcity) {
        const slots = slotsByCategory.get(category) ?? [];
        let slotsLeft = slots.length;
        for (const slotIndex of slots) {
            // Fair share of what is left, so several slots of one category split the allowance instead of
            // the first one taking all of it. `Infinity` (uncapped) leaves the preference unconstrained.
            const fairShare = Number.isFinite(remaining[category])
                ? Math.max(1, Math.floor(remaining[category] / slotsLeft))
                : Number.POSITIVE_INFINITY;
            const option = pickBestAffordableOption(profiles, category, remaining, fairShare);
            slotsLeft -= 1;
            if (!option) {
                // Refused. Record WHY: an option spends from several budgets at once, so a slot can be
                // refused while this category's own allowance still has room — blocked by the incidental
                // pieces of every option that offers it. Distinguishing the two keeps the warning honest.
                if (remaining[category] > 0)
                    blockedWithBudgetLeft.add(category);
                continue; // left for the filler pass
            }
            consumeOptionFromBudget(remaining, option);
            addOptionToPieceCounts(piecesUsed, option);
            assigned[slotIndex] = { category, option };
        }
    }
    // Filler pass, in geometric order: whatever the capped categories could not pay for becomes the
    // category the base price covers without limit, so the closet stays fully sectioned.
    let filledSlots = 0;
    let droppedSlots = 0;
    for (let index = 0; index < ordered.length; index += 1) {
        if (assigned[index])
            continue;
        cappedCategories.add(ordered[index]);
        const option = pickBestAffordableOption(profiles, fillerCategory, remaining);
        if (!option) {
            droppedSlots += 1;
            continue;
        }
        consumeOptionFromBudget(remaining, option);
        addOptionToPieceCounts(piecesUsed, option);
        assigned[index] = { category: fillerCategory, option };
        filledSlots += 1;
    }
    const chosen = assigned.filter((entry) => entry !== undefined);
    if (cappedCategories.size > 0) {
        const spent = [...cappedCategories].filter((category) => !blockedWithBudgetLeft.has(category));
        const parts = [];
        if (spent.length > 0)
            parts.push(`allowance reached for ${spent.join(', ')}`);
        if (blockedWithBudgetLeft.size > 0) {
            parts.push(`no affordable option for ${[...blockedWithBudgetLeft].join(', ')} despite remaining allowance ` +
                '(blocked by the incidental pieces of every option that offers it)');
        }
        warnings.push(`${parts.join('; ')}; ${filledSlots} slot(s) filled with ${fillerCategory} instead.`);
    }
    if (droppedSlots > 0) {
        warnings.push(`${droppedSlots} section slot(s) dropped: the content-option file offers no ${fillerCategory} ` +
            'section to absorb them. The remaining sections take the width.');
    }
    if (chosen.length === 0) {
        warnings.push('Every section slot was refused by the fundamental design allowance.');
        return { sections: [], warnings, piecesUsed };
    }
    // `hasDrawers` and the section count both come from what was ACTUALLY chosen, not from the
    // pre-budget plan — a re-planned or dropped slot changes the width cap and the split.
    const hasDrawers = chosen.some(({ option }) => option[MultiClosetComponentType.multiClosetDrawerPart] > 0);
    const { fixedWidth, balanceWidth, warnings: widthWarnings } = distributeBalancedWidths(usable, chosen.length, hasDrawers, config);
    warnings.push(...widthWarnings);
    const balanceIndex = chosen.length - 1;
    let warnedNoBalanceOption = false;
    const sections = chosen.map(({ category, option }, i) => {
        const isBalance = i === balanceIndex;
        // The balance must stay cuttable; warn if no true non-drawer option exists.
        if (isBalance &&
            category !== MultiClosetComponentType.multiClosetDrawerPart &&
            option[MultiClosetComponentType.multiClosetDrawerPart] > 0 &&
            !warnedNoBalanceOption) {
            warnings.push('No non-drawer content option available — balance section may contain drawers.');
            warnedNoBalanceOption = true;
        }
        return {
            contentCatalogPath: option.path,
            category,
            width: isBalance ? balanceWidth : fixedWidth,
            isBalance
        };
    });
    return { sections, warnings, piecesUsed };
};

export { distributeSectionContents as default, distributeSectionContents };
