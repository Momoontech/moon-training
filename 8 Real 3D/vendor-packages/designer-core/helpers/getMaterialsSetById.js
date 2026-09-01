import { getDefaultMaterialsSet } from './getDefaultMaterialsSet.js';

function getMaterialsSetById(core, id) {
    return core.projectSettings.materials.materialsSets.get(id) || getDefaultMaterialsSet(core);
}

export { getMaterialsSetById as default };
