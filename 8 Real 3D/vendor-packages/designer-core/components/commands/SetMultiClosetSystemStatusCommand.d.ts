import { SystemStatus, UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
/**
 * Sets the workflow status of a system entry in `core.systemData` — writes `state.name` on the
 * entry with the given id (no-op if absent). Reactive: any consumer reading `core.systemData`
 * re-runs. Undo restores the previous snapshot.
 *
 * Entries carrying no `state` are passed through untouched: `AddMultiClosetSystemCommand` mints
 * `{ id, name }` only, and a status is meaningless without the `id`/`description` the loaded blob
 * supplies alongside it — this command never synthesizes one.
 */
export default class SetMultiClosetSystemStatusCommand implements Command {
    private readonly id;
    private readonly status;
    private prev;
    private hasPrev;
    constructor(id: UUID, status: SystemStatus);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
