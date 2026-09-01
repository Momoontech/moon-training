/**
 * Integration tests for `reconcileFreeBoxContainerBaysCommands` — the single owner of the
 * multiCloset fix-shelf invariant: `max(2, M + 1)` shelves for `M` stacks, strictly
 * alternating `divider, stack, divider, …, divider`.
 *
 * The invariant used to be patched imperatively at drop time by
 * `commitDragOnFreeBoxContainer` (designer3d), which only fired when the raycast landed on
 * the FreeBoxContainer itself and never removed a shelf from the SOURCE container of a
 * cross-container move — so a section could be left permanently short of a fix shelf, or with
 * two stacked on the same 32mm hole (which reads as a missing one). It now lives in one pure
 * helper + this command builder, called from every gesture that mutates `bays`.
 *
 * It is deliberately NOT a layout effect. The last test in this file is the reason: node
 * construction always sees an EMPTY `bays` (both `CreateNodeCommand` and
 * `CreateNodeFromCatalogCommand` blank the child arrays before `createNode` and attach the
 * children afterwards), so a reconciler that ran on construction would inject two generic
 * shelves and then delete the catalog's / the saved project's own ones as surplus.
 *
 * Fixture mirrors `freeBoxContainerLayoutEffect.test.ts`: Item → Carcass(FirstHoleOffset=F)
 * → FreeBoxContainer(multiCloset) → bays, with a seeded body material so the layout effect's
 * thickness lookup resolves.
 *
 * Per-test isolation: shape D (fresh core per `it`). Each case seeds a different bays array,
 * so the graph must be built fresh rather than reset.
 */
export {};
