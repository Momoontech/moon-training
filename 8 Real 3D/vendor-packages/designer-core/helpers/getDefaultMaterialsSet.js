import { getDefaultMaterialsSetId } from './getDefaultMaterialsSetId.js';

function getDefaultMaterialsSet(core) {
    const setsIds = Object.keys(core.projectSettings.materials.materialsSets);
    const defaultSetId = getDefaultMaterialsSetId(core);
    const newSetId = defaultSetId ? defaultSetId : setsIds[0];
    return core.projectSettings.materials.materialsSets.get(newSetId);
}

export { getDefaultMaterialsSet };
