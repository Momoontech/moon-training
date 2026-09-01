import { MultiClosetComponentType } from '../../../declarations';
import type { MultiClosetStackNumbers, SectionContentProfile } from '../types';
/**
 * How many PIECES of each category may still be used. `Infinity` means unlimited — the in-memory
 * form of "the fundamental design does not list this category" (see `fundamentalDesign.ts`).
 *
 * Total, not per closet: one budget is created per SYSTEM and drawn down as that system's closets
 * are generated, which is what makes the allowance shared rather than per item.
 */
export type PieceBudget = Record<MultiClosetComponentType, number>;
/**
 * A fresh budget from a per-system allowance (see `fundamentalDesign.ts`). A straight copy: the
 * numbers ARE the caps, and a `0` is a real zero — the category was not ordered, so nothing of it
 * may be built. There is no "absent means unlimited" rule here; unlimited is
 * {@link unlimitedPieceBudget}, chosen explicitly by the caller.
 */
export declare const createPieceBudget: (allowance: MultiClosetStackNumbers) => PieceBudget;
/** An all-unlimited budget — what "do not enforce the fundamental design" plans against. */
export declare const unlimitedPieceBudget: () => PieceBudget;
/** An all-zero piece tally, the accumulator shape for "what a plan actually used". */
export declare const emptyPieceCounts: () => MultiClosetStackNumbers;
/**
 * Does one section of this option still fit? Checked across EVERY category, not just the one the
 * slot was planned for: a mixed option (`10-10-10DBShelvesContentTall` = 2 shelves + 3 drawers)
 * spends from two budgets at once, and ignoring the incidental one is how a cap gets exceeded.
 */
export declare const optionFitsBudget: (option: SectionContentProfile, budget: PieceBudget) => boolean;
/** Subtract one section of `option` from `budget`, in place. */
export declare const consumeOptionFromBudget: (budget: PieceBudget, option: SectionContentProfile) => void;
/** Add one section of `option` to a piece tally, in place. */
export declare const addOptionToPieceCounts: (counts: MultiClosetStackNumbers, option: SectionContentProfile) => void;
/** Subtract an already-used tally from a running budget, in place. Used to draw the SYSTEM budget
 *  down after each closet of that system has been planned. */
export declare const subtractPieceCountsFromBudget: (budget: PieceBudget, used: MultiClosetStackNumbers) => void;
/** `true` when at least one category is actually capped — i.e. the budget can refuse something. */
export declare const isPieceBudgetConstrained: (budget: PieceBudget) => boolean;
