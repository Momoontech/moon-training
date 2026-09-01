import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Affordance gates behind the toolbar's Replace button — one predicate per replaceable KIND, plus the
 * union the button reads. Each is the path-independent half of its builder in `./replaceNode`, so the
 * button, the picker's scope and the swap are gated by the SAME signal-tracked read.
 */
/** Is this node's CONTENT swappable — a multiCloset section the lock cascade leaves unlocked. */
export declare const canReplaceSectionContent: (core: CoreDesigner, nodeId: UUID) => boolean;
/**
 * Is this a replaceable placed PRODUCT — an Item whose whole node can be swapped for another preset.
 * `false` for a multiCloset Item: a closet is replaced section by section, and swapping it wholesale
 * would discard every section under it. Products have no lock flag yet; this is the line to read it.
 */
export declare const canReplaceItem: (core: CoreDesigner, nodeId: UUID) => boolean;
/**
 * Is this node replaceable AT ALL — a multiCloset SECTION (its content is swapped) or a placed product
 * ITEM (the node itself is). A third kind is a new gate plus one clause here, and the matching branch
 * in `getReplaceScope` / `applyReplaceNode`.
 */
export declare const canReplaceNode: (core: CoreDesigner, nodeId: UUID) => boolean;
