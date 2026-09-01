/**
 * Sets the workflow status of a system entry in `core.systemData` — writes `state.name` on the
 * entry with the given id (no-op if absent). Reactive: any consumer reading `core.systemData`
 * re-runs. Undo restores the previous snapshot.
 *
 * Entries carrying no `state` are passed through untouched: `AddMultiClosetSystemCommand` mints
 * `{ id, name }` only, and a status is meaningless without the `id`/`description` the loaded blob
 * supplies alongside it — this command never synthesizes one.
 */
class SetMultiClosetSystemStatusCommand {
    id;
    status;
    prev = [];
    hasPrev = false;
    constructor(id, status) {
        this.id = id;
        this.status = status;
    }
    execute(core) {
        const current = core.systemData.peek();
        this.prev = current;
        this.hasPrev = true;
        core.systemData.set(current.map((s) => (s?.id === this.id && s.state ? { ...s, state: this.status } : s)));
        return true;
    }
    undo(core) {
        if (!this.hasPrev)
            return false;
        core.systemData.set(this.prev);
        return true;
    }
}

export { SetMultiClosetSystemStatusCommand as default };
