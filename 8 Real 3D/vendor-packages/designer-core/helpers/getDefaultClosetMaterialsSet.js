import { getDefaultClosetMaterialsSetId } from './getDefaultClosetMaterialsSetId.js';

function getDefaultClosetMaterialsSet(core) {
    const setsIds = Object.keys(core.projectSettings.materials.closetMaterialsSets);
    const defaultSetId = getDefaultClosetMaterialsSetId(core);
    const newSetId = defaultSetId ? defaultSetId : setsIds[0];
    return core.projectSettings.materials.closetMaterialsSets.get(newSetId);
}

export { getDefaultClosetMaterialsSet as default };
