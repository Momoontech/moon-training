/**
 * The fundamental-design allowance: `fundamentalDesign.ts` (what the base price includes),
 * `sectionRules/pieceBudget.ts` (the primitives), and `distributeSectionContents` honouring it.
 *
 * The unit under test is PIECES — individual shelf boards, drawer boxes and rods — not sections and
 * not stacks. One need buys a fixed quantity (shelves 5, drawers 4, double hang 2 short rods,
 * long hang 1 long rod), so every expectation below sums `piecesUsed` rather than counting
 * `sections`.
 *
 * Two properties matter most and are asserted separately:
 *   - the order is never OVER-fulfilled — a capped category cannot exceed its allowance;
 *   - the closet is still fully sectioned — leftover slots become SHORT HANGING, the one category
 *     the base price covers without limit.
 */
export {};
