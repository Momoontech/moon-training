/**
 * Tests for `components/Node/helpers/getNodesBySystem` — returns the ids of
 * every multiCloset Item assigned to a given system.
 *
 * The default mock graph has no multiCloset, so each test seeds throwaway
 * multiCloset Items via `createNode` (Tier 2) and unregisters them in
 * `afterEach` — the helper iterates the live node set, so leftover closets would
 * leak across tests. The MOCK_ITEM_ID cabinet is reset too: one test force-
 * assigns a `system` on it to prove non-multiCloset nodes are filtered out.
 */
export {};
