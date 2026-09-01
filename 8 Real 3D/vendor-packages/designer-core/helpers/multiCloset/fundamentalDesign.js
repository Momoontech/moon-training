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
import { emptyPieceCounts } from './sectionRules/pieceBudget.js';
import { getSystemSectionDesire } from './systemNeeds.js';

/**
 * Fundamental design — what the base price includes, expressed per NEED.
 *
 * **This file is THE editable seam.** The fundamental-design requirements change as pricing
 * changes, so the whole rule lives in the three constants and one function below. No rule
 * downstream needs touching when they move.
 *
 * **The unit is PIECES** — individual shelf boards, drawer boxes and rods, not sections and not
 * stacks. That is what a content option's profile reports (`ShelvesStackContentTall` → 5 shelves;
 * `10-10-10DBShelvesContentTall` → 2 shelves + 3 drawers), so an allowance is checked by summing
 * the profiles of the sections a plan actually uses.
 *
 * **TARGET and CEILING are two different things, and only one of them comes from the price.**
 *
 *   | need                | category     | target | ceiling |
 *   |---------------------|--------------|--------|---------|
 *   | Shelves             | shelf        | 5      | 5       |
 *   | Drawers             | drawer       | 4      | 4       |
 *   | Double hang section | short hanger | 2      | none    |
 *   | Long-hang section   | long hanger  | 1      | none    |
 *
 * The TARGET is what the auto-fill aims at, and for hanging it is simply the COMPOSITION OF ONE
 * SECTION: a double-hang section physically holds two short rods, a long-hang section one long rod.
 * That is a structural fact about the section, not an allowance — which is why those two numbers
 * exist even though the price sheet says hanging is unlimited.
 *
 * The CEILING is what auto-fill may not exceed, and it is the TARGET for every category but one.
 * "Unlimited" on the price sheet means *no surcharge*, not *put in as many as fit*: long hanging is
 * free to add, yet an order for one long-hang section must still come back with one long rod, not
 * two. Over-delivering a free category is still over-delivering.
 *
 * The single exception is the FILLER (short hanging), which is unbounded because something has to
 * absorb the leftover width. That is the whole reason the remainder is short hanging specifically
 * and not "whichever category is nominally unlimited".
 *
 * {@link FUNDAMENTAL_DESIGN_PIECE_LIMITS} is the price sheet itself: it clamps the target so a
 * doubled need cannot aim past what the base price covers.
 *
 * A category nobody asked for has TARGET `0` — it is never aimed at, so no slot is ever created for
 * it. "Office Wall Unit", whose only need is long hanging, therefore gets no shelf and no drawer
 * SECTIONS, because filling it with them would deliver an order that was never placed.
 *
 * Its CEILING, however, is what the price covers, not `0`. A section is one physical unit and often
 * carries pieces of several categories: the only drawer content in the catalog is
 * "3 drawers + 3 shelves". With an un-ordered category pinned to `0` that option is unaffordable
 * outright, so a shelves-free drawer order came back with ZERO drawers — an order under-delivered to
 * protect a category nobody was charged for. Incidental pieces are part of the section the customer
 * DID order; they are allowed up to the price limit, they are just never aimed at.
 *
 * **Short hanging is also the FILLER.** A closet is as wide as it is: once the capped categories
 * are exhausted, the leftover slots have to become something, and short hanging is the one category
 * that costs nothing extra — so it absorbs the remainder rather than the closet being left short of
 * sections. This is why a system that never asked for short hanging can still receive it.
 *
 * For a singly-listed capped category the two numbers coincide — aiming at the included amount and
 * refusing to exceed it is one decision, which is what "make sure the order is not over-fulfilled"
 * asks for. Whether the ceiling is enforced at all is the caller's switch
 * (`limitToFundamentalDesign` on `fillMultiClosets`): off means the design may exceed what is
 * included, and the extra is billable.
 *
 * **The allowance belongs to the SYSTEM, not to an item.** One budget is resolved per system and
 * drawn down as that system's closets are generated in turn, so two closets of one system share the
 * entitlement rather than each getting a fresh one.
 */
/**
 * What ONE need of each category aims at, in pieces. For the capped categories this is the included
 * amount; for hanging it is the composition of a single section (double hang = 2 short rods, long
 * hang = 1 long rod). Used ONLY as the target — never as a limit.
 */
const FUNDAMENTAL_DESIGN_PIECES_PER_NEED = {
    [MultiClosetComponentType.multiClosetShelfPart]: 5,
    [MultiClosetComponentType.multiClosetDrawerPart]: 4,
    [MultiClosetComponentType.multiClosetShortHangerPart]: 2,
    [MultiClosetComponentType.multiClosetLongHangerPart]: 1
};
/**
 * The price sheet: how many pieces the base price covers per system. An ABSENT key means no
 * surcharge at any quantity ("unlimited short hangers, unlimited long hangers").
 *
 * Deliberately NOT per need — "includes the price of ≤ 5 shelves" is a total for the system, so
 * listing shelves twice does not buy ten. Used to CLAMP the target; it is not the allocation
 * ceiling (see the module doc — that distinction is why long hanging is unlimited here yet still
 * gets exactly the one rod that was ordered).
 */
const FUNDAMENTAL_DESIGN_PIECE_LIMITS = {
    [MultiClosetComponentType.multiClosetShelfPart]: 5,
    [MultiClosetComponentType.multiClosetDrawerPart]: 4
    // short hangers — unlimited (deliberately absent)
    // long hangers  — unlimited (deliberately absent)
};
/** Categories the base price covers at any quantity — derived, so the two cannot drift. */
const FUNDAMENTAL_DESIGN_FREE_CATEGORIES = Object.values(MultiClosetComponentType).filter((category) => FUNDAMENTAL_DESIGN_PIECE_LIMITS[category] === undefined);
/**
 * The category that absorbs slots the others can no longer pay for, and the ONLY one planned
 * without a ceiling. Must be one of {@link FUNDAMENTAL_DESIGN_FREE_CATEGORIES} — a filler that
 * costs extra would bill the customer for the leftover width, and a bounded one would run out and
 * leave the closet with dropped sections.
 */
const FUNDAMENTAL_DESIGN_FILLER_CATEGORY = MultiClosetComponentType.multiClosetShortHangerPart;
/**
 * The allowance for `systemId`, from its needs.
 *
 * The TARGET sums {@link FUNDAMENTAL_DESIGN_PIECES_PER_NEED} over the needs, then clamps the result
 * to {@link FUNDAMENTAL_DESIGN_PIECE_LIMITS} so a doubled need cannot aim past what the base price
 * covers. The CEILING equals that target for every category except the filler, which is unbounded.
 *
 * `core` and `systemId` are read-only. When the fundamental design becomes per-system (a
 * `fundamentalDesign` field on the system entry, or a lookup keyed by `systemTypeEntityId` /
 * `systemTypeName`) the branch lands in THIS function body and no caller changes.
 */
const getFundamentalDesignAllowance = (core, systemId) => {
    const { desire, unmappedNeedNames, hasAnyNeed } = getSystemSectionDesire(core, systemId);
    const target = emptyPieceCounts();
    const budget = emptyPieceCounts();
    for (const category of Object.values(MultiClosetComponentType)) {
        // `desire[category]` is the NUMBER OF NEEDS of that category; the table turns needs into pieces.
        const orderedPieces = desire[category] * FUNDAMENTAL_DESIGN_PIECES_PER_NEED[category];
        const priceLimit = FUNDAMENTAL_DESIGN_PIECE_LIMITS[category];
        target[category] = priceLimit === undefined ? orderedPieces : Math.min(orderedPieces, priceLimit);
        if (category === FUNDAMENTAL_DESIGN_FILLER_CATEGORY) {
            budget[category] = Infinity; // absorbs the leftover width
        }
        else if (orderedPieces > 0) {
            budget[category] = target[category]; // ordered → held to exactly what was asked for
        }
        else {
            // Un-ordered: never aimed at (target 0), but a mixed section may still carry some of it up to
            // what the price covers. Pinning this to 0 makes every mixed option unbuildable — see the
            // module doc on the zero-drawers case.
            budget[category] = priceLimit ?? Infinity;
        }
    }
    // The filler must always be buildable, even for a system that never asked for it — otherwise the
    // leftover slots of e.g. a long-hang-only system have nothing to become. It is uncapped, so this
    // only affects the SPLIT (giving the filler a share to aim at), never the ceiling.
    if (hasAnyNeed && target[FUNDAMENTAL_DESIGN_FILLER_CATEGORY] === 0) {
        target[FUNDAMENTAL_DESIGN_FILLER_CATEGORY] = FUNDAMENTAL_DESIGN_PIECES_PER_NEED[FUNDAMENTAL_DESIGN_FILLER_CATEGORY];
    }
    return { target, budget, unmappedNeedNames, hasAnyNeed };
};

export { FUNDAMENTAL_DESIGN_FILLER_CATEGORY, FUNDAMENTAL_DESIGN_FREE_CATEGORIES, FUNDAMENTAL_DESIGN_PIECES_PER_NEED, FUNDAMENTAL_DESIGN_PIECE_LIMITS, getFundamentalDesignAllowance };
