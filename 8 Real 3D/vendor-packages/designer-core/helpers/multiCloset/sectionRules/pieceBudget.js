import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import { MultiClosetComponentType } from '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';

/**
 * A fresh budget from a per-system allowance (see `fundamentalDesign.ts`). A straight copy: the
 * numbers ARE the caps, and a `0` is a real zero — the category was not ordered, so nothing of it
 * may be built. There is no "absent means unlimited" rule here; unlimited is
 * {@link unlimitedPieceBudget}, chosen explicitly by the caller.
 */
const createPieceBudget = (allowance) => ({
    [MultiClosetComponentType.multiClosetShelfPart]: allowance[MultiClosetComponentType.multiClosetShelfPart],
    [MultiClosetComponentType.multiClosetShortHangerPart]: allowance[MultiClosetComponentType.multiClosetShortHangerPart],
    [MultiClosetComponentType.multiClosetLongHangerPart]: allowance[MultiClosetComponentType.multiClosetLongHangerPart],
    [MultiClosetComponentType.multiClosetDrawerPart]: allowance[MultiClosetComponentType.multiClosetDrawerPart]
});
/** An all-unlimited budget — what "do not enforce the fundamental design" plans against. */
const unlimitedPieceBudget = () => ({
    [MultiClosetComponentType.multiClosetShelfPart]: Infinity,
    [MultiClosetComponentType.multiClosetShortHangerPart]: Infinity,
    [MultiClosetComponentType.multiClosetLongHangerPart]: Infinity,
    [MultiClosetComponentType.multiClosetDrawerPart]: Infinity
});
/** An all-zero piece tally, the accumulator shape for "what a plan actually used". */
const emptyPieceCounts = () => ({
    [MultiClosetComponentType.multiClosetShelfPart]: 0,
    [MultiClosetComponentType.multiClosetShortHangerPart]: 0,
    [MultiClosetComponentType.multiClosetLongHangerPart]: 0,
    [MultiClosetComponentType.multiClosetDrawerPart]: 0
});
/**
 * Does one section of this option still fit? Checked across EVERY category, not just the one the
 * slot was planned for: a mixed option (`10-10-10DBShelvesContentTall` = 2 shelves + 3 drawers)
 * spends from two budgets at once, and ignoring the incidental one is how a cap gets exceeded.
 */
const optionFitsBudget = (option, budget) => {
    for (const category of Object.values(MultiClosetComponentType)) {
        if (option[category] > budget[category])
            return false;
    }
    return true;
};
/** Subtract one section of `option` from `budget`, in place. */
const consumeOptionFromBudget = (budget, option) => {
    for (const category of Object.values(MultiClosetComponentType)) {
        budget[category] -= option[category];
    }
};
/** Add one section of `option` to a piece tally, in place. */
const addOptionToPieceCounts = (counts, option) => {
    for (const category of Object.values(MultiClosetComponentType)) {
        counts[category] += option[category];
    }
};
/** Subtract an already-used tally from a running budget, in place. Used to draw the SYSTEM budget
 *  down after each closet of that system has been planned. */
const subtractPieceCountsFromBudget = (budget, used) => {
    for (const category of Object.values(MultiClosetComponentType)) {
        budget[category] -= used[category];
    }
};
/** `true` when at least one category is actually capped — i.e. the budget can refuse something. */
const isPieceBudgetConstrained = (budget) => Object.values(MultiClosetComponentType).some((category) => Number.isFinite(budget[category]));

export { addOptionToPieceCounts, consumeOptionFromBudget, createPieceBudget, emptyPieceCounts, isPieceBudgetConstrained, optionFitsBudget, subtractPieceCountsFromBudget, unlimitedPieceBudget };
