/**
 * System needs → the section-content desire vector.
 *
 * A system's `needs` are what the customer asked for, authored BACK-END side as free text
 * (`{ systemTypeNeedId, name, done }`). They carry no counts and no catalog paths, so turning
 * them into the planner's `MultiClosetStackNumbers` takes two steps:
 *
 *   1. map each need's NAME onto a `MultiClosetComponentType` (this file's registry);
 *   2. count the mapped needs per category — one need = one unit of desire.
 *
 * **Why one unit per need, not a slider value.** The desire vector is a RELATIVE emphasis, not a
 * count: `intensityToTargetCounts` divides the closet's section slots between the categories in
 * proportion to it. So "the customer wants shelves, drawers and long hanging" becomes
 * `{shelf: 1, drawer: 1, longHanger: 1, shortHanger: 0}` and the closet is split three ways, with
 * short hanging never getting a slot (a `0` category can never receive a section). How MANY rods
 * or boxes a chosen section physically holds is a property of the section itself — a
 * "Double hang section" need maps to ONE unit of short-hang desire, and the two rods come from the
 * `DoubleHungContentTall` option's own profile, picked by the closest-fit matcher.
 *
 * **`done` is ignored** — see {@link getSystemSectionDesire}.
 *
 * **Unknown names are dropped, never guessed.** A system legitimately carries needs that are not
 * section categories at all ("Lighting", "Venting"), and the back-end can add new ones at any
 * time. Both cases land in `unmappedNeedNames` so the caller can log them; a name the registry
 * does not know can never silently become a section.
 */
import { MultiClosetComponentType, SystemNeeds, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Fold a back-end need name into a lookup key: case- and punctuation-insensitive, with a trailing
 * "section" dropped. That is what lets one registry entry absorb the whole family the back-end
 * actually emits — `"Long-hang section"`, `"Long hang"`, `"long_hang_section"` all fold to
 * `longhang`.
 */
export declare const normalizeNeedName: (name: string) => string;
/**
 * Normalized need name → the category it expresses.
 *
 * Keyed by the folded form (see {@link normalizeNeedName}), so entries are lower-case and
 * punctuation-free. Singular and plural are listed separately rather than stemmed — the folding
 * rule stays trivial to reason about, and closet vocabulary is small enough that an explicit list
 * is cheaper than a stemmer that has to be debugged.
 *
 * Observed back-end names (Custom Closet system type): "Shelves", "Drawers",
 * "Double hang section", "Long-hang section".
 */
export declare const NEED_CATEGORY_BY_NORMALIZED_NAME: Record<string, MultiClosetComponentType>;
/** The category a single need expresses, or `undefined` when it is not a section need. */
export declare const getNeedCategory: (need: SystemNeeds) => MultiClosetComponentType | undefined;
/** An all-zero desire vector — the "nothing requested" starting point. */
export declare const emptySectionDesire: () => Record<MultiClosetComponentType, number>;
export interface SystemSectionDesire {
    /** Per-category desire, summed over the system's mapped needs. All-zero when none mapped. */
    desire: Record<MultiClosetComponentType, number>;
    /** Names the registry did not recognise, in `needs` order — for the caller to log. */
    unmappedNeedNames: string[];
    /** `true` when at least one need mapped, i.e. the system expresses a fillable layout. */
    hasAnyNeed: boolean;
}
/**
 * The desire vector for one system, read from `core.systemData`.
 *
 * `done` is deliberately NOT filtered on. It tracks fulfilment in the sales-client checklist and
 * is flipped AFTER a section lands, so filtering by it would make the fill non-idempotent: the
 * second run of the same closet would see a different (shrinking) desire vector and plan a
 * different layout. The needs describe what the system should contain, not what is left to do.
 *
 * Duplicate categories SUM: two needs that both mean shelves read as twice the shelf emphasis,
 * which is the natural reading of "the customer asked for it twice".
 *
 * A missing system id, a system with no `needs`, or one whose needs are all unrecognised all
 * yield an all-zero desire with `hasAnyNeed: false` — the caller decides what to do with that
 * (`fillMultiClosets` skips the closet and leaves it retryable rather than inventing a layout).
 *
 * Non-reactive: reads through `peek()`, since the fill is a one-shot action, not an effect.
 */
export declare const getSystemSectionDesire: (core: CoreDesigner, systemId: UUID | undefined) => SystemSectionDesire;
export default getSystemSectionDesire;
