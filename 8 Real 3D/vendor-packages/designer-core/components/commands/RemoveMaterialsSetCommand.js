import { RemoveMaterialsBaseSetCommand } from './RemoveMaterialsBaseSetCommand.js';

class RemoveMaterialsSetCommand extends RemoveMaterialsBaseSetCommand {
    getCollection(core) {
        return core.projectSettings.materials.materialsSets;
    }
}

export { RemoveMaterialsSetCommand as default };
