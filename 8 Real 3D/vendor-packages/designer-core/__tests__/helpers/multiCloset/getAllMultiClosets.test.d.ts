/**
 * Tests for `helpers/multiCloset/getAllMultiClosets` — returns the ids of every
 * multiCloset Item in the project — plus the `isGenerated` flag those Items now
 * carry (default `false`, serialized only when `true`).
 *
 * The default mock graph has no multiCloset, so each test seeds throwaway
 * multiCloset Items via `createNode` (Tier 2) and unregisters them in `afterEach`
 * — the helper iterates the live node set, so leftover closets would leak across
 * tests.
 */
export {};
