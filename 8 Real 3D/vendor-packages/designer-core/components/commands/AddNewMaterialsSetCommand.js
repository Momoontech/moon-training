import { getDefaultMaterialsSet } from '../../helpers/getDefaultMaterialsSet.js';
import { AddNewMaterialsBaseSetCommand } from './AddNewMaterialsBaseSetCommand.js';

class AddNewMaterialsSetCommand extends AddNewMaterialsBaseSetCommand {
    getCollection(core) {
        return core.projectSettings.materials.materialsSets;
    }
    getDefaultSet(core) {
        return getDefaultMaterialsSet(core);
    }
}

export { AddNewMaterialsSetCommand as default };
