/**
 * Tests for `components/Node/helpers/getSystemById` — resolves the multiCloset
 * system a node belongs to (walking up to the enclosing multiCloset Item) and
 * returns that system's id.
 *
 * The default mock graph has no multiCloset, so each test seeds throwaway
 * multiCloset Items / parts via `createNode` (Tier 2) and unregisters them in
 * `afterEach` — these helpers iterate the live node set, so leftover closets
 * would leak across tests.
 */
export {};
