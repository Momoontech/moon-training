import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
/**
 * Assigns a multiCloset Item to a project-level system by writing the system's
 * UUID onto the closet's `system` `Value`. The `Value` is created on first
 * assignment (with the correct `nodeId` binding) when the closet was imported
 * without one — mirroring how `SetNodeAttributeValueCommand` auto-creates a
 * missing attribute. Undo restores the previous reference, or drops the freshly
 * created `Value` when there was none before.
 */
export default class SetMultiClosetSystemCommand implements Command {
    private readonly nodeId;
    private readonly systemId;
    private prevValue;
    private created;
    constructor(nodeId: UUID, systemId: UUID);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
