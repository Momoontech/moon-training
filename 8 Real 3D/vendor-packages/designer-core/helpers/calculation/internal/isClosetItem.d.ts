import { Item } from '../../../components/Node/components/Item';
/**
 * A closet item is routed to `perPart` (not `perItem`/`perProject`). This covers
 * the property-flagged closets (`isSingleCloset` / `isMultiCloset`, set by the
 * vesta importer) AND the native `itemType === multiCloset` (which a UI-created
 * multiCloset carries WITHOUT the property, so the itemType check is required).
 *
 * `reachInCloset` is intentionally NOT included — it is a room-like closet that
 * spawns a dependent Room and holds no Parts.
 */
export declare const isClosetItem: (item: Item) => boolean;
