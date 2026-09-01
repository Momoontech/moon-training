import { getDefaultStockMaterialsSet } from './getDefaultStockMaterialsSet.js';

function getStockMaterialsSetById(core, id) {
    return core.projectSettings.materials.stockMaterialsSets.get(id) || getDefaultStockMaterialsSet(core);
}

export { getStockMaterialsSetById };
