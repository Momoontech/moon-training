/**
 * Tests for `components/Node/helpers/getParentByCondition` — the shared
 * self-or-ancestor walk behind the typed lookups (e.g. `getSystemById`).
 *
 * Per-test isolation: pure-read. These tests only read the default mock graph
 * (`MOCK_ITEM_ID` → `MOCK_PARENT_ITEM_ID` → `TEST_FLOORPLAN_ID`) and never
 * mutate the core, so the shared instance needs no reset.
 */
export {};
