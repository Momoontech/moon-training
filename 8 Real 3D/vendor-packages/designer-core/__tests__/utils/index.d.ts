/**
 * Shared fixture barrel for designer-core tests.
 *
 * **Import this barrel before any deep `../../components/…` or
 * `../../helpers/…` import in a test file.** `designer-core` has a module
 * cycle — `components/Value/index.ts` imports the package root barrel, which
 * re-exports `designer-core.ts`, which in turn imports `components/Value` — so
 * whichever module enters the graph first decides whether the cycle resolves.
 * Entering at certain deep modules leaves half-initialised bindings behind and
 * the file fails to load or build a core:
 *
 *   - `Class extends value undefined` — `TransformedValue` evaluated its
 *     `extends Value` clause while `components/Value/index.ts` was still on the
 *     stack (seen when a test's first import is `components/Value`).
 *   - `Unknown node type: Item` — `createNode`'s constructor registry object was
 *     built while a node class module was still initialising, so the entry is
 *     `undefined` (seen when a test's first import is
 *     `components/Node/helpers/getNode`).
 *
 * Importing this barrel first enters through `createMockCore` → `designer-core`,
 * the order the app itself uses, and the cycle resolves cleanly. Type-only
 * imports are erased at compile time, so only value imports need to be ordered.
 */
export * from './setupBase';
export * from './coreInputs';
export * from './materials';
export * from './nodes';
export * from './catalog';
export * from './createMockCore';
export * from './floorplan';
