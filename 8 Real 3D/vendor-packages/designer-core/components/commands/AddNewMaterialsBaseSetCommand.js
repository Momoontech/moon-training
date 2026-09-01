import { generateId } from '../../helpers/id.js';

class AddNewMaterialsBaseSetCommand {
    materialsSet;
    id = generateId();
    constructor(materialsSet) {
        this.materialsSet = materialsSet;
    }
    execute(core) {
        const defaultSet = this.getDefaultSet(core);
        this.getCollection(core).add(this.id, this.materialsSet || defaultSet);
        return true;
    }
    undo(core) {
        if (!this.id)
            return false;
        this.getCollection(core).delete(this.id);
        return true;
    }
}

export { AddNewMaterialsBaseSetCommand };
