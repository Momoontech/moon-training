import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Route a click on a shelves-stack empty COMPARTMENT (a component part of the
 * `multiClosetShelfPart` category) to the adjustable shelf
 * BOARD it should select. The compartments are not selectable; instead the empty gaps act as extended
 * hit regions for their neighbouring boards.
 *
 * A shelves stack interleaves `[compartment, board, compartment, …, compartment]`, so a compartment at
 * child index `i` has its board above at `i+1` and below at `i-1`:
 *   - bottom/first compartment (no board below) → the board above it,
 *   - top/last compartment (no board above) → the board below it,
 *   - a middle compartment → the board above when `topHalf`, else the board below.
 *
 * `topHalf` is whether the click landed in the upper half of the compartment (caller computes it in the
 * compartment's local frame, so it is rotation-independent). Returns `undefined` when `compartmentId`
 * is not a compartment sitting in a stack, or has no adjacent board.
 */
export declare const getShelfBoardForCompartmentClick: (core: CoreDesigner, compartmentId: UUID, topHalf: boolean) => UUID | undefined;
