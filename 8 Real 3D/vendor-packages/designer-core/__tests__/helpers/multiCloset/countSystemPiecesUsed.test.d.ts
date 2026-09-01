/**
 * Tests for `countSystemPiecesUsed` — how many pieces a system's EXISTING closets already account
 * for, read back off the scene.
 *
 * This is what makes the fundamental-design allowance survive across separate `fillMultiClosets()`
 * calls. Generate one closet, drag out a second from the same system, generate again: without this
 * the second call starts from a fresh 5 shelves / 4 drawers and the system is over-delivered.
 *
 * The count is in PROFILE units — each section's content node carries the `catalogPath` it was
 * instantiated from, and that path is priced against the same option list the budget was spent
 * against. Counting scene geometry instead would drift, since a shelves stack's shelf components
 * are empty compartments while the boards are `freeBoxContainerInteriorPart`s.
 */
export {};
