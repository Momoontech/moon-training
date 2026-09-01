import { MultiClosetComponentType, MultiClosetStackType, PartType } from '../../declarations/Part.js';

/**
 * MultiCloset section-content part types — the stack + item layer.
 *
 * Below a section's constant chain (`multiClosetSectionContent` → Carcass →
 * BoxContainer → Part → FreeBoxContainer) the FreeBoxContainer holds an ordered
 * list of **stack** Parts, and each stack holds 1..N **component** Parts.
 *
 * **KIND and CATEGORY are two separate fields.** `partType` carries only the kind —
 * `PartType.multiClosetStackPart` for every stack, `PartType.multiClosetComponentPart`
 * for every opening — while the category (shelves / short hang / long hang / drawers)
 * lives on the Part's own `multiClosetStackType` / `multiClosetComponentType` signal.
 * Consequences for callers:
 *
 *   - the `is…PartType` guards answer the KIND question from a bare `partType` and are
 *     deliberately category-blind (that is all most consumers — resize, delete, drag,
 *     BOM — actually need);
 *   - the category needs the NODE, not a `partType`, which is why
 *     `getCategoryFor{Stack,Item}PartType` take a `Part`. A part whose catalog shell
 *     declares no discriminator answers `undefined` rather than defaulting;
 *   - `MULTI_CLOSET_CONTENT_PART_TYPES` is keyed by `MultiClosetComponentType`, so adding
 *     a category (e.g. a shoe shelf) is a *compile error* until its stack + component
 *     types are wired — nothing else branches on the specific category.
 *
 * Naming is per-entry: stacks use the plural category word
 * (`multiClosetShelvesStackPart`), components the singular (`multiClosetShelfPart`).
 * The registry sidesteps fragile auto-pluralization.
 *
 * Lives in `helpers/multiCloset/` (not `declarations/Part.ts`) so `declarations/` stays a
 * leaf with no `helpers` import. Mirrors the existing joint-part pattern in
 * `declarations/Part.ts` (`MULTI_CLOSET_JOINT_PART_SIDES` / `isMultiClosetJointPartType`).
 *
 * See `multiClosetContentStructure.md` for the full structural spec.
 */
/**
 * Single source of truth: category → its stack + component discriminators. Typed as
 * `Record<MultiClosetComponentType, …>` so a new category cannot be added without also
 * wiring its pair here. Note the category IS the component discriminator, so
 * `itemPartType` is the key itself — the entry exists for the stack half.
 */
const MULTI_CLOSET_CONTENT_PART_TYPES = {
    [MultiClosetComponentType.multiClosetShelfPart]: {
        stackPartType: MultiClosetStackType.multiClosetShelvesStackPart,
        itemPartType: MultiClosetComponentType.multiClosetShelfPart
    },
    [MultiClosetComponentType.multiClosetShortHangerPart]: {
        stackPartType: MultiClosetStackType.multiClosetShortHangersStackPart,
        itemPartType: MultiClosetComponentType.multiClosetShortHangerPart
    },
    [MultiClosetComponentType.multiClosetLongHangerPart]: {
        stackPartType: MultiClosetStackType.multiClosetLongHangersStackPart,
        itemPartType: MultiClosetComponentType.multiClosetLongHangerPart
    },
    [MultiClosetComponentType.multiClosetDrawerPart]: {
        stackPartType: MultiClosetStackType.multiClosetDrawersStackPart,
        itemPartType: MultiClosetComponentType.multiClosetDrawerPart
    }
};
/**
 * Every stack discriminator, one per category. NOT `PartType`s — the reverse
 * "which category is this?" lookup moved off `partType` onto the node's own signal, so
 * these arrays enumerate `MultiClosetStackType` / `MultiClosetComponentType` instead.
 * A consumer keying a table by `partType` wants the two `PartType` members below, not
 * these (see `getResizableSides`' `RESIZE_BEHAVIORS`).
 */
const MULTI_CLOSET_STACK_PART_TYPES = Object.values(MultiClosetStackType);
/** Every component discriminator, one per category. See the note above. */
const MULTI_CLOSET_ITEM_PART_TYPES = Object.values(MultiClosetComponentType);
/**
 * Guard: is this `partType` a multiCloset content stack? Category-blind by design — one
 * `PartType` now covers shelves / hangers / drawers alike. For the category, read
 * {@link getCategoryForStackPartType} off the node.
 */
const isMultiClosetStackPartType = (partType) => partType === PartType.multiClosetStackPart;
/** Guard: is this `partType` a multiCloset content component? Category-blind — see above. */
const isMultiClosetItemPartType = (partType) => partType === PartType.multiClosetComponentPart;
/** The stack discriminator for a category. */
const getStackPartTypeForCategory = (category) => MULTI_CLOSET_CONTENT_PART_TYPES[category].stackPartType;
/** The component discriminator for a category (the identity function on the key). */
const getItemPartTypeForCategory = (category) => MULTI_CLOSET_CONTENT_PART_TYPES[category].itemPartType;
/**
 * The stack category of a Part — read off its own `multiClosetStackType` signal.
 *
 * Takes the NODE, not a `partType`: every stack shares one `PartType`, so the category is
 * no longer recoverable from it. `undefined` when the part is not a stack, or when its
 * catalog shell declared no discriminator — callers must treat that as "unknown", never as
 * a default category. The read is signal-tracked, so it is reactive inside an effect.
 */
const getCategoryForStackPartType = (part) => part.multiClosetStackType?.get();
/** The component category of a Part. Same contract as {@link getCategoryForStackPartType}. */
const getCategoryForItemPartType = (part) => part.multiClosetComponentType?.get();

export { MULTI_CLOSET_CONTENT_PART_TYPES, MULTI_CLOSET_ITEM_PART_TYPES, MULTI_CLOSET_STACK_PART_TYPES, getCategoryForItemPartType, getCategoryForStackPartType, getItemPartTypeForCategory, getStackPartTypeForCategory, isMultiClosetItemPartType, isMultiClosetStackPartType };
