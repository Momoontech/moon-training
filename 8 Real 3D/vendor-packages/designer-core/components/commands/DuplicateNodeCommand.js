import { resolveParentChildProperty } from '../../helpers/resolveParentChildProperty.js';
import { isOrderedChildrenProperty } from '../Node/helpers/childrenProperties.js';
import { CreateNodeCommand, RemoveNodeCommand } from './CreateNodeCommand.js';
import { collectSubtreeObjects, remapSubtreeToNewIds } from './duplicateSubtreeHelpers.js';

class DuplicateNodeCommand {
    nodeId;
    target;
    duplicatedRootId = null;
    clone = null;
    /**
     * @param nodeId source subtree to clone.
     * @param target optional explicit destination. When omitted, the clone lands next to
     *   the source (same parent/slot; `index + 1` for ordered slots, appended otherwise).
     */
    constructor(nodeId, target) {
        this.nodeId = nodeId;
        this.target = target;
    }
    execute(core) {
        // First run snapshots; every later run (redo) replays that same snapshot — see `clone`.
        const clone = this.clone ?? this.buildClone(core);
        if (!clone) {
            return false;
        }
        this.clone = clone;
        core.runCommandsAsTransaction(new CreateNodeCommand(clone.objects, clone.newRootId, clone.target.parentId, clone.target.childProperty, clone.target.insertIndex), '', false);
        this.duplicatedRootId = clone.newRootId;
        return true;
    }
    /** Resolves the destination and snapshots the source subtree under fresh ids. First execute only. */
    buildClone(core) {
        let target;
        if (this.target) {
            target = this.target;
        }
        else {
            const resolved = resolveParentChildProperty(core, this.nodeId);
            if (!resolved) {
                return null;
            }
            target = {
                parentId: resolved.parentId,
                childProperty: resolved.childProperty,
                insertIndex: resolved.index !== undefined && isOrderedChildrenProperty(resolved.childProperty)
                    ? resolved.index + 1
                    : undefined
            };
        }
        const objects = collectSubtreeObjects(core, this.nodeId);
        if (!(this.nodeId in objects)) {
            return null;
        }
        const remapped = remapSubtreeToNewIds(objects, this.nodeId);
        if (!remapped) {
            return null;
        }
        return { objects: remapped.objects, newRootId: remapped.newRootId, target };
    }
    undo(core) {
        if (!this.duplicatedRootId) {
            return false;
        }
        core.runCommandsAsTransaction(new RemoveNodeCommand(this.duplicatedRootId), '', false);
        return true;
    }
}

export { DuplicateNodeCommand };
