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
import { Part } from '../../components/Node';
import { MultiClosetComponentType, MultiClosetStackType, PartType } from '../../declarations/Part';
/** The stack + component discriminator pairing for one section-content category. */
export interface MultiClosetContentPartTypes {
    /** Discriminator of the stack container that holds 1..N components of this category. */
    stackPartType: MultiClosetStackType;
    /** Discriminator of the individual component (one shelf compartment / hanger / drawer). */
    itemPartType: MultiClosetComponentType;
}
/**
 * Single source of truth: category → its stack + component discriminators. Typed as
 * `Record<MultiClosetComponentType, …>` so a new category cannot be added without also
 * wiring its pair here. Note the category IS the component discriminator, so
 * `itemPartType` is the key itself — the entry exists for the stack half.
 */
export declare const MULTI_CLOSET_CONTENT_PART_TYPES: Record<MultiClosetComponentType, MultiClosetContentPartTypes>;
/**
 * Every stack discriminator, one per category. NOT `PartType`s — the reverse
 * "which category is this?" lookup moved off `partType` onto the node's own signal, so
 * these arrays enumerate `MultiClosetStackType` / `MultiClosetComponentType` instead.
 * A consumer keying a table by `partType` wants the two `PartType` members below, not
 * these (see `getResizableSides`' `RESIZE_BEHAVIORS`).
 */
export declare const MULTI_CLOSET_STACK_PART_TYPES: MultiClosetStackType[];
/** Every component discriminator, one per category. See the note above. */
export declare const MULTI_CLOSET_ITEM_PART_TYPES: MultiClosetComponentType[];
/**
 * Guard: is this `partType` a multiCloset content stack? Category-blind by design — one
 * `PartType` now covers shelves / hangers / drawers alike. For the category, read
 * {@link getCategoryForStackPartType} off the node.
 */
export declare const isMultiClosetStackPartType: (partType: PartType | undefined) => boolean;
/** Guard: is this `partType` a multiCloset content component? Category-blind — see above. */
export declare const isMultiClosetItemPartType: (partType: PartType | undefined) => boolean;
/** The stack discriminator for a category. */
export declare const getStackPartTypeForCategory: (category: MultiClosetComponentType) => MultiClosetStackType;
/** The component discriminator for a category (the identity function on the key). */
export declare const getItemPartTypeForCategory: (category: MultiClosetComponentType) => MultiClosetComponentType;
/**
 * The stack category of a Part — read off its own `multiClosetStackType` signal.
 *
 * Takes the NODE, not a `partType`: every stack shares one `PartType`, so the category is
 * no longer recoverable from it. `undefined` when the part is not a stack, or when its
 * catalog shell declared no discriminator — callers must treat that as "unknown", never as
 * a default category. The read is signal-tracked, so it is reactive inside an effect.
 */
export declare const getCategoryForStackPartType: (part: Part) => MultiClosetStackType | undefined;
/** The component category of a Part. Same contract as {@link getCategoryForStackPartType}. */
export declare const getCategoryForItemPartType: (part: Part) => MultiClosetComponentType | undefined;
