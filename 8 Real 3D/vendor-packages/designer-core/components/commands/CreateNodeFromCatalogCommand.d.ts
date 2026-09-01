import { CatalogConfig, NodeConfig, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { childrenProperties, singleChildProperties } from '../Node/helpers/childrenProperties';
import { Command } from './core/Command';
export default class CreateNodeFromCatalogCommand implements Command {
    private catalogPath;
    private parentId;
    private nodeId;
    private optionalData;
    private childProperty;
    /** When set and `childProperty` is a list, insert the new id at this index instead of appending. */
    private insertIndex?;
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
    private savedObjects;
    constructor(catalogPath: CatalogConfig, parentId: UUID, nodeId: UUID, optionalData?: Partial<NodeConfig>, childProperty?: (typeof childrenProperties)[number] | (typeof singleChildProperties)[number], 
    /** When set and `childProperty` is a list, insert the new id at this index instead of appending. */
    insertIndex?: number | undefined);
    execute(core: CoreDesigner): boolean;
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
    private promoteSystemStatus;
    undo(core: CoreDesigner): boolean;
}
