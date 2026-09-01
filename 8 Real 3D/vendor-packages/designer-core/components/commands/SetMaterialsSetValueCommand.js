import { SetMaterialsBaseValueCommand } from './SetMaterialsBaseValueCommand.js';

class SetMaterialsSetValueCommand extends SetMaterialsBaseValueCommand {
    getSet(core) {
        return core.projectSettings.materials.materialsSets.get(this.setId);
    }
}

export { SetMaterialsSetValueCommand as default };
