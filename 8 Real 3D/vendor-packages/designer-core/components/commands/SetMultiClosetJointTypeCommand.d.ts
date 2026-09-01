import { MultiClosetsJointType, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
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
export default class SetMultiClosetJointTypeCommand implements Command {
    private readonly partId;
    private readonly jointType;
    private inner;
    constructor(partId: UUID, jointType: MultiClosetsJointType);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
