import getDefaultClosetMaterialsSet from './getDefaultClosetMaterialsSet.js';

function getClosetMaterialsSetById(core, id) {
    return core.projectSettings.materials.closetMaterialsSets.get(id) || getDefaultClosetMaterialsSet(core);
}

export { getClosetMaterialsSetById };
