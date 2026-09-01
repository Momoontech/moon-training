function getDefaultMaterialsSetId(core) {
    return core.projectSettings.materials.get('defaultMaterialsSet').get();
}

export { getDefaultMaterialsSetId };
