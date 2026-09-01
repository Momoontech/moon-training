function getDefaultClosetMaterialsSetId(core) {
    return core.projectSettings.materials.get('defaultClosetMaterialsSet').get();
}

export { getDefaultClosetMaterialsSetId };
