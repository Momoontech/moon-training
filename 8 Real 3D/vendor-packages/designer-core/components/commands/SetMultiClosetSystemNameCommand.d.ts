import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
/**
 * Renames a system entry in `core.systemData` — sets the `name` of the entry with the given id
 * (no-op if absent). Reactive: any consumer reading `core.systemData` re-runs. Undo restores the
 * previous snapshot.
 */
export default class SetMultiClosetSystemNameCommand implements Command {
    private readonly id;
    private readonly name;
    private prev;
    private hasPrev;
    constructor(id: UUID, name: string);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
