/**
 * Tests for `sectionRules/restrictDesireToAvailableCategories` — the gate that makes the
 * content-option file the CLOSED set of usable section types.
 *
 * Without it the ban is silently broken: `pickBestOption` returns the nearest option for any
 * requested category, so a desire the file cannot satisfy becomes some other section type. These
 * cases pin that such a category is zeroed (and reported) instead.
 */
export {};
