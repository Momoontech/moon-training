import { generateId } from '../../helpers/id.js';
import { getMonitor } from '../../helpers/monitor.js';
import parseCatalog from '../helpers/parseCatalog.js';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties.js';
import getNode from '../Node/helpers/getNode.js';
import snapshotNodeTree from '../Node/helpers/snapshotNodeTree.js';
import { RemoveNodeCommand, CreateNodeCommand } from './CreateNodeCommand.js';
import CreateNodeFromCatalogCommand from './CreateNodeFromCatalogCommand.js';

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
class ReplaceNodeFromCatalogCommand {
    nodeId;
    catalogPath;
    optionalData;
    /** Root id of the replacement subtree — minted here, so callers can address it before execute. */
    newNodeId = generateId();
    originalObjects = {};
    newObjects = {};
    parentId;
    childProperty = 'children';
    insertIndex;
    firstRun = true;
    constructor(nodeId, catalogPath, 
    /**
     * Merged OVER the preset and the carried-through `attributes` — how a caller seeds what the preset
     * lacks. Product entries carry no `position` / `rotation` (the drop path supplies those) and
     * `withPosition3D` / `withRotation` read them unguarded, so a replacement must pass a placement.
     */
    optionalData = {}) {
        this.nodeId = nodeId;
        this.catalogPath = catalogPath;
        this.optionalData = optionalData;
    }
    /** Public accessor so callers can map original → replacement ids after execute. */
    getNewNodeId() {
        return this.newNodeId;
    }
    execute(core) {
        // Signal writes performed by the nested remove + create below are coalesced
        // by the `batch()` that `TransactionManager.packExecute` opens around every
        // `runCommandsAsTransaction` call. This is important because this command is
        // commonly dispatched from inside a layout effect (e.g.
        // `updateMultiClosetItemLayoutEffect`) that itself subscribes to
        // `parent.children/sections/separators`. Without batching, the internal
        // `RemoveNodeCommand` → `disposeNode` would synchronously re-enter the
        // running effect ("Cycle detected"); with it, those notifications are
        // deferred until the replacement subtree is fully wired up.
        if (!this.firstRun) {
            // Redo path: scene currently has the original subtree (restored by undo).
            // Swap it back out for the replacement subtree.
            return this.swap(core, this.nodeId, this.newNodeId, this.newObjects);
        }
        const node = getNode(core, this.nodeId);
        if (!node)
            return false;
        this.parentId = node.parent.get();
        if (!this.parentId) {
            // Replacing a root-level node is not supported (CreateNodeFromCatalogCommand
            // requires a parentId). Bail out to avoid corrupting the scene graph.
            getMonitor().error(`🔥 ReplaceNodeFromCatalogCommand: cannot replace node ${this.nodeId} without a parent`);
            return false;
        }
        this.locateInParent(core, this.parentId, this.nodeId);
        const originalAttributes = (node.toJSON().attributes ??
            {});
        const remove = new RemoveNodeCommand(this.nodeId);
        core.runCommandsAsTransaction(remove, '', false);
        this.originalObjects = remove.objects;
        const parsed = parseCatalog(core, this.catalogPath, this.parentId, this.newNodeId);
        const catalogAttributes = (parsed.attributes ?? {});
        const mergedAttributes = { ...catalogAttributes, ...originalAttributes };
        core.runCommandsAsTransaction(new CreateNodeFromCatalogCommand(this.catalogPath, this.parentId, this.newNodeId, { attributes: mergedAttributes, ...this.optionalData }, this.childProperty, this.insertIndex), '', false);
        this.newObjects = snapshotNodeTree(core, this.newNodeId);
        this.firstRun = false;
        return true;
    }
    undo(core) {
        // The remove+recreate under `swap` is batched by `packExecute` so that
        // intermediate parent-list mutations don't re-enter subscribed effects.
        return this.swap(core, this.newNodeId, this.nodeId, this.originalObjects);
    }
    /**
     * Removes whichever subtree currently lives at `removeId` and recreates the snapshot
     * rooted at `createRootId` at the original parent/slot/index. The snapshot is deep
     * cloned because `CreateNodeCommand.execute` mutates its `objects` argument.
     */
    swap(core, removeId, createRootId, snapshot) {
        core.runCommandsAsTransaction(new RemoveNodeCommand(removeId), '', false);
        core.runCommandsAsTransaction(new CreateNodeCommand(JSON.parse(JSON.stringify(snapshot)), createRootId, this.parentId, this.childProperty, this.insertIndex), '', false);
        return true;
    }
    /**
     * Walks the parent's child slots to determine which property holds `nodeId` and,
     * for list-typed slots, the sibling index. Mirrors the lookup logic in
     * `removeNodeRecursive`.
     */
    locateInParent(core, parentId, nodeId) {
        const parent = getNode(core, parentId);
        if (!parent)
            return;
        for (let i = 0; i < childrenProperties.length; i += 1) {
            const prop = childrenProperties[i];
            if (prop in parent) {
                const siblings = parent[prop].get();
                if (siblings) {
                    const idx = siblings.indexOf(nodeId);
                    if (idx !== -1) {
                        this.childProperty = prop;
                        this.insertIndex = idx;
                        return;
                    }
                }
            }
        }
        for (let i = 0; i < singleChildProperties.length; i += 1) {
            const prop = singleChildProperties[i];
            if (prop in parent) {
                const child = parent[prop].get();
                if (child === nodeId) {
                    this.childProperty = prop;
                    this.insertIndex = undefined;
                    return;
                }
            }
        }
    }
}

export { ReplaceNodeFromCatalogCommand as default };
