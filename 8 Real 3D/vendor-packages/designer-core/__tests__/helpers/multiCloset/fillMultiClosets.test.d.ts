/**
 * Tests for `helpers/multiCloset/fillMultiClosets` — the project-wide fill
 * orchestration behind `core.fillMultiClosets()`.
 *
 * The scene-mutating primitive (`applyMultiClosetSections`) is mocked here: this
 * suite covers `fillMultiClosets`' OWN conditional logic — the pending
 * (`isGenerated`) filter, the per-SYSTEM desire resolution, the empty-options
 * early-out, the three skip branches, the "mark generated only when the plan
 * produced sections" branch, and the single-undo-step wrapping — not the
 * closest-fit planner (unit-tested elsewhere) or catalog instantiation.
 *
 * The option list is DATA, not a fetch: the helper takes it as an argument and
 * `core.fillMultiClosets()` supplies `core.sectionOptions`, seeded by the app via
 * `setSectionOptionsFromJSON`. So there is no `fetch` to stub and no network
 * failure path — only the "never seeded / empty list" no-op, covered below.
 *
 * `applyMultiClosetSections` is mocked to a `vi.fn` so each test controls the
 * returned plan and no real subtree is built; the real `SetValueCommand` still
 * runs, so the `isGenerated` flip and its undo are exercised for real.
 *
 * The desire vector is no longer a constant: it is derived from the owning
 * system's `needs`, so every fixture closet must declare a `system` and that
 * system must exist in `core.systemData`. That coupling is the point of the
 * feature and most of what these tests assert.
 */
export {};
