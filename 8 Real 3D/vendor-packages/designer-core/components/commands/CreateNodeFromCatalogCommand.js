import { generateId } from '../../helpers/id.js';
import { getSystemStatusCommandOnClosetAdded } from '../../helpers/multiCloset/systemStatus.js';
import parseCatalog from '../helpers/parseCatalog.js';
import createNode from '../Node/helpers/createNode.js';
import getNode from '../Node/helpers/getNode.js';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties.js';
import snapshotNodeTree from '../Node/helpers/snapshotNodeTree.js';
import { CreateNodeCommand, RemoveNodeCommand } from './CreateNodeCommand.js';

class CreateNodeFromCatalogCommand {
    catalogPath;
    parentId;
    nodeId;
    optionalData;
    childProperty;
    insertIndex;
    /**
     * Snapshot of the created node tree captured at the end of the first execute.
     *
     * The snapshot is taken inside the outer `batch()` that `packExecute` opens
     * around every `runCommandsAsTransaction` call, so subscribed layout effects
     * (e.g. `updateMultiClosetItemLayoutEffect`) have NOT yet flushed when it is
     * captured — it reflects the pre-effect subtree. Redo rebuilds from this
     * snapshot; any in-construction replacements dispatched by effects will re-run
     * on redo against the restored pre-effect state.
     */
    savedObjects = null;
    constructor(catalogPath, parentId, nodeId, optionalData = {}, childProperty = 'children', 
    /** When set and `childProperty` is a list, insert the new id at this index instead of appending. */
    insertIndex) {
        this.catalogPath = catalogPath;
        this.parentId = parentId;
        this.nodeId = nodeId;
        this.optionalData = optionalData;
        this.childProperty = childProperty;
        this.insertIndex = insertIndex;
    }
    execute(core) {
        // Redo path: reconstruct from the stable snapshot captured on first execute.
        // `CreateNodeCommand.execute` mutates the objects dict (clears child arrays),
        // so we deep-copy before handing it over.
        // Note: signal writes performed while wiring up the subtree are coalesced by
        // the `batch()` that `TransactionManager.packExecute` opens around every
        // `runCommandsAsTransaction` call. Without that batching, attaching this node
        // to its parent would synchronously fire layout effects (e.g.
        // `updateMultiClosetItemLayoutEffect`) that may spawn a
        // `ReplaceNodeFromCatalogCommand` against the node being built and invalidate
        // `this.nodeId`/`this.parentId` mid-recursion.
        if (this.savedObjects) {
            core.runCommandsAsTransaction(new CreateNodeCommand(JSON.parse(JSON.stringify(this.savedObjects)), this.nodeId, this.parentId, this.childProperty, this.insertIndex), '', false);
            this.promoteSystemStatus(core);
            return true;
        }
        const catalog = parseCatalog(core, this.catalogPath, this.parentId, this.nodeId);
        const childProperties = {};
        const singleChildrenProperties = {};
        const childIds = {};
        const singleChildIds = {};
        for (const prop of childrenProperties) {
            if (prop in catalog) {
                for (let i = 0; i < catalog[prop].length; i += 1) {
                    const uuid = generateId();
                    if (!childProperties[prop]) {
                        childProperties[prop] = [];
                    }
                    if (!childIds[prop]) {
                        childIds[prop] = [];
                    }
                    childProperties[prop].push(catalog[prop][i]);
                    childIds[prop].push(uuid);
                }
                catalog[prop] = [];
            }
        }
        for (const prop of singleChildProperties) {
            if (prop in catalog) {
                const uuid = generateId();
                if (!singleChildIds[prop]) {
                    singleChildIds[prop] = uuid;
                }
                singleChildrenProperties[prop] = catalog[prop];
                singleChildIds[prop] = uuid;
                catalog[prop] = null;
            }
        }
        createNode({ ...catalog, parent: this.parentId, uuid: this.nodeId, ...this.optionalData }, core);
        this.promoteSystemStatus(core);
        const parent = getNode(core, this.parentId);
        if (parent) {
            if (childrenProperties.includes(this.childProperty)) {
                const siblings = parent[this.childProperty].get();
                let next;
                if (this.insertIndex !== undefined) {
                    const at = Math.max(0, Math.min(this.insertIndex, siblings.length));
                    next = [...siblings.slice(0, at), this.nodeId, ...siblings.slice(at)];
                }
                else {
                    next = [...siblings, this.nodeId];
                }
                parent[this.childProperty].set(next);
            }
            else {
                parent[this.childProperty].set(this.nodeId);
            }
        }
        for (const prop of childrenProperties) {
            if (childProperties[prop]) {
                for (let i = 0; i < childProperties[prop].length; i += 1) {
                    const child = childProperties[prop][i];
                    if (child && childIds[prop]) {
                        core.runCommandsAsTransaction([
                            new CreateNodeFromCatalogCommand(parseCatalog(core, child, this.nodeId, childIds[prop][i]), this.nodeId, childIds[prop][i], {}, prop)
                        ], '', false);
                    }
                }
            }
        }
        for (const prop of singleChildProperties) {
            if (singleChildrenProperties[prop]) {
                if (singleChildrenProperties[prop] && singleChildIds[prop]) {
                    core.runCommandsAsTransaction([
                        new CreateNodeFromCatalogCommand(parseCatalog(core, singleChildrenProperties[prop], this.nodeId, singleChildIds[prop]), this.nodeId, singleChildIds[prop], {}, prop)
                    ], '', false);
                }
            }
        }
        // NOTE: this runs inside the outer `batch()` opened by
        // `TransactionManager.packExecute`, which means subscribed layout effects
        // (e.g. `updateMultiClosetItemLayoutEffect`) have NOT yet flushed when we
        // snapshot. The snapshot therefore captures the pre-effect subtree. That's
        // fine for first-run correctness, but on redo, effects will re-dispatch any
        // `ReplaceNodeFromCatalogCommand`s from a fresh state and allocate new
        // UUIDs — callers relying on stable ids across undo/redo should rely on the
        // replacement commands' own snapshots (`ReplaceNodeFromCatalogCommand`
        // stores `originalObjects`/`newObjects` with stable ids) instead.
        this.savedObjects = snapshotNodeTree(core, this.nodeId);
        return true;
    }
    /**
     * Stamp the new node's system to `Plot`. The Systems-tab drag is the one drop that ships a
     * `system` on its catalog config, so this fires for exactly that gesture and no-ops for every
     * other catalog item.
     *
     * The write is **unconditional on the system's current status** — a drop into a system already
     * at `Design` / `Present` / `Signed` pulls it back to `Plot`. That is deliberate; see the module
     * doc on `helpers/multiCloset/systemStatus` for the rule and its interaction with the
     * step-driven `updateSystemStatusEffect`.
     *
     * Hooked here rather than on `CreateNodeCommand` on purpose: `setAppDataFromJSON` builds the
     * whole scene through `CreateNodeCommand`, so stamping there would re-`Plot` every occupied
     * system on every project load. Recomputed per call rather than cached so the redo branch
     * resolves the node's system off the live graph.
     *
     * `undo` has no counterpart here, and is therefore NOT a general inverse. It removes the node,
     * and `RemoveNodeCommand`'s hook demotes only when that was the system's LAST closet. So undoing
     * a drop round-trips cleanly for the empty-`Draft` case (`Draft → Plot → Draft`), but a drop into
     * a system that still holds other closets leaves it at `Plot` instead of the status it had
     * before the drop.
     */
    promoteSystemStatus(core) {
        const command = getSystemStatusCommandOnClosetAdded(core, this.nodeId);
        if (command)
            core.runCommandsAsTransaction(command, '', false);
    }
    undo(core) {
        core.runCommandsAsTransaction(new RemoveNodeCommand(this.nodeId), '', false);
        return true;
    }
}

export { CreateNodeFromCatalogCommand as default };
