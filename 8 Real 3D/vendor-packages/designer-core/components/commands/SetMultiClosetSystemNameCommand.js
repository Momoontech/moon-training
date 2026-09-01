/**
 * Renames a system entry in `core.systemData` — sets the `name` of the entry with the given id
 * (no-op if absent). Reactive: any consumer reading `core.systemData` re-runs. Undo restores the
 * previous snapshot.
 */
class SetMultiClosetSystemNameCommand {
    id;
    name;
    prev = [];
    hasPrev = false;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    execute(core) {
        const current = core.systemData.peek();
        this.prev = current;
        this.hasPrev = true;
        core.systemData.set(current.map((s) => (s?.id === this.id ? { ...s, name: this.name } : s)));
        return true;
    }
    undo(core) {
        if (!this.hasPrev)
            return false;
        core.systemData.set(this.prev);
        return true;
    }
}

export { SetMultiClosetSystemNameCommand as default };
