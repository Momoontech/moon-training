/**
 * Integration tests for the multiCloset stack-layout effects in
 * `components/Node/helpers/effects.ts` (wiring on top of the pure `stackLayout`
 * math, which is unit-tested separately). Every stack category shares one model —
 * item openings interleaved with real `freeBoxContainerInteriorPart` dividers, laid out by
 * `tileStackBands`:
 *   - short / long hangers, drawers → items are the hanger/drawer, dividers are reveal separators,
 *   - shelves → items are the empty compartments, dividers are the shelf boards,
 *   - re-runs reactively when the stack's `size.y` changes.
 *
 * Each stack is built under a top-level Item using `MOCK_MATERIALS_SET_ID`; the test
 * seeds that set's body material with a known thickness `T` so the effect's
 * body-thickness lookup resolves, then asserts children match the helper output
 * (verifying wiring, not re-deriving the math). The divider children are built directly
 * (they are baked into the catalog templates in the real app). The layout effect writes
 * `position.y` for every child and `size.y` for items only, so divider sizes are not asserted.
 */
export {};
