import { SetMaterialsBaseValueCommand } from './SetMaterialsBaseValueCommand.js';

class SetMaterialsClosetSetValueCommand extends SetMaterialsBaseValueCommand {
    getSet(core) {
        return core.projectSettings.materials.closetMaterialsSets.get(this.setId);
    }
}

export { SetMaterialsClosetSetValueCommand as default };
