function getDefaultStockMaterialsSet(core) {
    const setsIds = Object.keys(core.projectSettings.materials.stockMaterialsSets);
    // const defaultSetId = getDefaultMaterialsSetId();
    // const newSetId = defaultSetId ? defaultSetId : setsIds[ 0 ];
    const newSetId = setsIds[0];
    return core.projectSettings.materials.stockMaterialsSets.get(newSetId);
}

export { getDefaultStockMaterialsSet };
