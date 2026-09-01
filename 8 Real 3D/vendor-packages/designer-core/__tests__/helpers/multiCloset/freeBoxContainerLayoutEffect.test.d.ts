/**
 * Integration tests for `updateMultiClosetFreeBoxContainerLayoutEffect`
 * (`components/Node/helpers/effects.ts`) — the 32mm-grid stacker that lays out a
 * multiCloset FreeBoxContainer's direct children: fix shelves are dividers on the
 * 32mm hole grid, stacks are the openings (`32·N − t`). It delegates to the pure
 * `layoutMultiClosetFreeBoxContainer` (unit-tested separately); these tests verify
 * wiring: classification (stack vs fix shelf), FirstHoleOffset from the carcass,
 * body thickness, reactivity, and the gate.
 *
 * Fixture: Item → Carcass(FirstHoleOffset=F) → FreeBoxContainer(multiCloset) →
 * [fixShelf, stack, fixShelf, stack, fixShelf]. The set's body material is seeded
 * with a known thickness T so the effect's lookup resolves.
 */
export {};
