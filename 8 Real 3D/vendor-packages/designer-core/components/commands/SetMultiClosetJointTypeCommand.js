import { getMultiClosetJointTarget } from '../../helpers/getMultiClosetJointTarget.js';
import SetNodeAttributeValueCommand from './SetNodeAttributeValueCommand.js';

/**
 * Sets the joint type for a multiCloset joint, given the joint `Part` the user
 * interacted with (on EITHER the prober or the receiver closet). The actual
 * write always lands on the "joined-to" (vertical) Item's facing-side
 * `Left/RightJointType` attribute — resolved through `getMultiClosetJointTarget`
 * — so both joint dropdowns drive the same single source of truth.
 *
 * Delegates the attribute mutation (and its undo / auto-create semantics) to
 * `SetNodeAttributeValueCommand`, built at `execute` time once the target is
 * resolved. No-ops (returns `false`) when the part resolves to no joint
 * relationship.
 *
 * This command is intentionally selection-agnostic. When a joint-type control
 * should also keep the 3D outline on the joint (the old joint part loses
 * `exists` on a type switch, and the active part may move to the OTHER closet),
 * resolve the next part with `getActiveMultiClosetJointPartId` and pair this with
 * a `SetSelectedNodeIdCommand` in the same transaction.
 */
class SetMultiClosetJointTypeCommand {
    partId;
    jointType;
    inner = undefined;
    constructor(partId, jointType) {
        this.partId = partId;
        this.jointType = jointType;
    }
    execute(core) {
        const target = getMultiClosetJointTarget(core, this.partId);
        if (!target)
            return false;
        this.inner = new SetNodeAttributeValueCommand(target.itemId, `${target.side}JointType`, this.jointType);
        return this.inner.execute(core);
    }
    undo(core) {
        if (!this.inner)
            return false;
        return this.inner.undo(core);
    }
}

export { SetMultiClosetJointTypeCommand as default };
