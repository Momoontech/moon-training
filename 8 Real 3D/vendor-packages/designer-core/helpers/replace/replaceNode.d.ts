import { Command } from '../../components/commands/core/Command';
import { CatalogConfig, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * Swaps a section's CONTENT for the preset at `catalogPath`, or `null` when invalid. Mirrors Phase B of
 * `applyMultiClosetSections` (and `dragOnPart`), so a picked preset lands like a planned one — and the
 * section NODE is untouched, so its box survives and the layout effect refits the new content into it.
 */
export declare const replaceSectionContent: (core: CoreDesigner, nodeId: UUID, catalogPath: CatalogConfig) => Command[] | null;
/** What {@link replaceItem} hands back: the swap, plus the id its replacement will live under. */
export interface ReplaceItemPlan {
    /** The swap itself. Dispatch as ONE transaction. */
    commands: Command[];
    /** Id the replacement lives under, minted up front so a caller can address it before execute. */
    newNodeId: UUID;
}
/**
 * Swaps a placed product ITEM for the preset at `catalogPath`, or `null` when invalid. The preset's own
 * `size` wins, but product entries carry no `position` / `rotation` (the drop path supplies those, and
 * `withPosition3D` reads them unguarded), so the original's is seeded in — verbatim, formulas included.
 */
export declare const replaceItem: (core: CoreDesigner, nodeId: UUID, catalogPath: CatalogConfig) => ReplaceItemPlan | null;
/**
 * Replaces `nodeId` with the preset at `catalogPath`; returns whether anything applied. THE call a
 * picker makes — it branches on what the node IS, refuses what `canReplaceNode` refuses, and owns the
 * transaction split the Item swap needs (see below). Pairs with `getReplaceScope`, same branches.
 */
export declare const applyReplaceNode: (core: CoreDesigner, nodeId: UUID, catalogPath: CatalogConfig) => boolean;
export default applyReplaceNode;
