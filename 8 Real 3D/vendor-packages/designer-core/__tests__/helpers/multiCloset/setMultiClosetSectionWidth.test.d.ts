/**
 * Spec for the multiCloset section WIDTH write path: `canSetMultiClosetSectionWidth` (the
 * value-independent guard, also the details-panel field-enable read) and `setMultiClosetSectionWidth`
 * (the command builder that shares it).
 *
 * The last describe-block is the reason the predicate exists at all: it is NOT interchangeable with
 * `getResizableSides(...).left || right`. The two answer different questions — "may the user TYPE a
 * width" vs "may the user DRAG this edge" — and they disagree in both directions. Deleting the
 * predicate in favour of the oracle would enable a Width input that the write path then refuses.
 */
export {};
