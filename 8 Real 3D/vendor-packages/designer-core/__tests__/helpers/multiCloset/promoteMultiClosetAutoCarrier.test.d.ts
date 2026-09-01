/**
 * Tests for the "every multiCloset container keeps at least one AUTO-SIZED child" invariant, at all
 * three levels: an `Item`'s sections (leftover WIDTH), a `FreeBoxContainer`'s stacks and a stack's
 * openings (leftover 32mm HOLES). Without it the layout walks hand the remainder to nobody —
 * `updateMultiClosetItemLayoutEffect` never stretches a section, `splitHoles` returns `[]` and every
 * unclaimed hole is DROPPED — so the container ends in a dead gap: the deleted balance section, the
 * remaining drawer that stops filling its stack, the fill whose balance slot landed on a lock.
 *
 * Layers mirror the code: the pure, level-agnostic decision (`pickMultiClosetAutoCarrier`) against
 * plain state rows, then the command builder against a real core per level, which is where the
 * shared pieces (`collect*AutoStates` + `getResizeAbsorberCommands`) are wired.
 */
export {};
