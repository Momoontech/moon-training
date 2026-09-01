class RemoveMaterialsBaseSetCommand {
    id;
    removedSet = undefined;
    constructor(id) {
        this.id = id;
    }
    execute(core) {
        const collection = this.getCollection(core);
        this.removedSet = collection.get(this.id);
        if (!this.removedSet)
            return false;
        collection.delete(this.id);
        return true;
    }
    undo(core) {
        if (!this.removedSet)
            return false;
        this.getCollection(core).add(this.id, this.removedSet);
        return true;
    }
}

export { RemoveMaterialsBaseSetCommand };
