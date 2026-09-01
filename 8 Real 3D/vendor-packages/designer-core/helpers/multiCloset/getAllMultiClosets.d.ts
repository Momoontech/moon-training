import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Return the ids of every multiCloset Item in the project.
 *
 * Walks the reactive `nodeIds` set once and keeps the Items whose `itemType`
 * is `multiCloset` (mirrors {@link getNodesBySystem}, minus the system filter).
 * Returns an empty array when the scene holds no closets.
 *
 * Pair with `getItem(core, id).isGenerated` to tell already-filled closets from
 * fresh ones — this is what `fillMultiClosets` uses to skip generated closets.
 */
declare const getAllMultiClosets: (core: CoreDesigner) => UUID[];
export default getAllMultiClosets;
