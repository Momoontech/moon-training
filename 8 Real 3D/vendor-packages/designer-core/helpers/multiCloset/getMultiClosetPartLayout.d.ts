import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/** Which kind of multiCloset child a dimension entry annotates. */
export type MultiClosetPartKind = 'section' | 'separator';
/**
 * One along-wall dimension entry for a multiCloset child (section or separator).
 *
 * `localX` / `width` are in the multiCloset's own local frame — the same frame
 * `updateMultiClosetItemLayoutEffect` lays the children out in
 * ([packages/designer-core/src/components/Node/helpers/effects.ts](packages/designer-core/src/components/Node/helpers/effects.ts)),
 * where children are positioned along local `+X` as
 * `separator[0], section[0], separator[1], section[1], …, separator[N]`.
 * A consumer drawing in a wall-local frame adds the item's own `position.x`
 * to `localX` to get the child's left edge along the wall.
 */
export interface MultiClosetPartDimension {
    /** The child `Part` node id (section or separator). */
    id: UUID;
    kind: MultiClosetPartKind;
    /** Left edge in the multiCloset's local frame (inches). */
    localX: number;
    /** Along-wall width (`size.x`) of the child (inches). */
    width: number;
    /**
     * Whether this child's width may be edited. Separators are standardized and
     * never editable; the single auto-sized "balance" section is computed by the
     * layout effect (the CTF remainder), so it is read-only too. Every other
     * (fixed-width) section is editable.
     */
    editable: boolean;
}
/**
 * Builds the ordered along-wall dimension list for a multiCloset's sections and
 * separators. Returns an empty array when `itemId` is not a multiCloset.
 *
 * Pure read — every `.get()` is signal-tracked, so call it inside a
 * `useComputedValue` (or any Preact-signal scope) to re-run when a section is
 * resized or the balance section reflows.
 *
 * Entries are sorted by `localX` so the result reads left-to-right along the
 * wall regardless of the order ids happen to sit in `sections` / `separators`.
 */
export declare const getMultiClosetPartLayout: (core: CoreDesigner, itemId: UUID) => MultiClosetPartDimension[];
export default getMultiClosetPartLayout;
