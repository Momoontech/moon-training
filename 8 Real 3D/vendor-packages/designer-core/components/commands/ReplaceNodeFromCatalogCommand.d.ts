import { CatalogConfig, NodeConfig, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
/**
 * Replaces an existing node (by id) with a fresh subtree built from a catalog path.
 *
 * Behaviour:
 * - The replacement node is created under a **freshly generated UUID** (`newNodeId`),
 *   NOT the original id. This guarantees downstream view layers (e.g. `syncNodeViewsEffect`
 *   in `designer3d`) observe a real id churn and rebuild their `NodeView` + effect
 *   subscriptions against the new `Node` instance instead of leaking stale signal
 *   bindings from the disposed original.
 * - Parent, child-property slot and sibling index are preserved.
 * - The original node's resolved `attributes` are merged on top of the catalog defaults
 *   (`{ ...catalogAttributes, ...originalAttributes }`) so user-customised attribute
 *   values survive the swap while any new catalog defaults seed missing keys.
 * - `optionalData` is merged over both — how a caller seeds config the preset lacks (a product
 *   entry has no `position` / `rotation`; see the constructor).
 * - Undo restores the original subtree at its original UUID (removing the `newNodeId`
 *   subtree currently in the scene). Redo re-applies the catalog subtree at `newNodeId`.
 * - Both snapshots (`originalObjects` / `newObjects`) carry stable UUIDs so repeated
 *   undo/redo cycles always reconstruct the exact same ids.
 *
 * State is stored as pure data snapshots (mirroring `RemoveNodeCommand`'s style) —
 * fresh `RemoveNodeCommand` / `CreateNodeCommand` instances are spawned on every
 * execute/undo rather than retaining nested command instances.
 */
export default class ReplaceNodeFromCatalogCommand implements Command {
    private nodeId;
    private catalogPath;
    /**
     * Merged OVER the preset and the carried-through `attributes` — how a caller seeds what the preset
     * lacks. Product entries carry no `position` / `rotation` (the drop path supplies those) and
     * `withPosition3D` / `withRotation` read them unguarded, so a replacement must pass a placement.
     */
    private optionalData;
    /** Root id of the replacement subtree — minted here, so callers can address it before execute. */
    private newNodeId;
    private originalObjects;
    private newObjects;
    private parentId;
    private childProperty;
    private insertIndex;
    private firstRun;
    constructor(nodeId: UUID, catalogPath: CatalogConfig, 
    /**
     * Merged OVER the preset and the carried-through `attributes` — how a caller seeds what the preset
     * lacks. Product entries carry no `position` / `rotation` (the drop path supplies those) and
     * `withPosition3D` / `withRotation` read them unguarded, so a replacement must pass a placement.
     */
    optionalData?: Partial<NodeConfig>);
    /** Public accessor so callers can map original → replacement ids after execute. */
    getNewNodeId(): UUID;
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
    /**
     * Removes whichever subtree currently lives at `removeId` and recreates the snapshot
     * rooted at `createRootId` at the original parent/slot/index. The snapshot is deep
     * cloned because `CreateNodeCommand.execute` mutates its `objects` argument.
     */
    private swap;
    /**
     * Walks the parent's child slots to determine which property holds `nodeId` and,
     * for list-typed slots, the sibling index. Mirrors the lookup logic in
     * `removeNodeRecursive`.
     */
    private locateInParent;
}
