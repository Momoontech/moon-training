import getDefaultClosetMaterialsSet from '../../helpers/getDefaultClosetMaterialsSet.js';
import { AddNewMaterialsBaseSetCommand } from './AddNewMaterialsBaseSetCommand.js';

class AddNewMaterialsClosetSetCommand extends AddNewMaterialsBaseSetCommand {
    getCollection(core) {
        return core.projectSettings.materials.closetMaterialsSets;
    }
    getDefaultSet(core) {
        return getDefaultClosetMaterialsSet(core);
    }
}

export { AddNewMaterialsClosetSetCommand as default };
