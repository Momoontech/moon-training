/**
 * Tests for `helpers/multiCloset/systemStatus` — the two occupancy rules that keep a system's
 * `state` in step with whether any multiCloset is assigned to it, plus their integration into
 * `RemoveNodeCommand`.
 *
 * The rules are asymmetric and the tests pin that down. The add rule fires for ANY assigned
 * closet and writes `Plot` unconditionally — it does not consult the system's current status, so
 * an advanced status is overwritten. The remove rule fires from any status too, but only once the
 * system is genuinely empty, and it skips a system already at `Draft`.
 *
 * The default mock graph has no multiCloset, so each test seeds throwaway closets via `createNode`
 * (Tier 2) and unregisters the survivors in `afterEach` — the helpers iterate the live node set, so
 * a leaked closet would keep a later test's system looking occupied.
 */
export {};
