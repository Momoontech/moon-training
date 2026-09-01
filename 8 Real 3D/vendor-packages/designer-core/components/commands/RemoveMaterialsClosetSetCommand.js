import { RemoveMaterialsBaseSetCommand } from './RemoveMaterialsBaseSetCommand.js';

class RemoveMaterialsClosetSetCommand extends RemoveMaterialsBaseSetCommand {
    getCollection(core) {
        return core.projectSettings.materials.closetMaterialsSets;
    }
}

export { RemoveMaterialsClosetSetCommand as default };
