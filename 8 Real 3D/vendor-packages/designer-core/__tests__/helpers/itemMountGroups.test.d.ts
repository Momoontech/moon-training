/**
 * Tests for the mount-group predicate — the single rule every intersection test
 * in the app routes through (planar + wall clearances, "fit to space", and the
 * drag pipeline's snap / resolve / nudge / SAT passes).
 *
 * Graph (all mounts parented straight to the stage placeholder wall so the
 * predicate's own inputs — the mount's `mountSlotTypes` and the item's
 * `mountTypes` — are the only thing under test):
 *
 *   FLOOR_MP    ['floor']              → FLOOR_ITEM       mountTypes ['floor','wall']
 *   CEILING_MP  ['ceiling']            → CEILING_ITEM     mountTypes ['ceiling','shelfBottom']
 *                                      → MISLABELLED_ITEM mountTypes ['floor','wall']
 *   MULTI_MP    ['shelf','ceiling']    → MULTI_SLOT_ITEM  mountTypes ['ceiling']
 *   FLOOR_MP                           → STRAY_LIGHT      mountTypes ['ceiling','shelfBottom']
 *   WALL_LINE   MountLine              → LINE_ITEM        mountTypes ['wall']
 */
export {};
