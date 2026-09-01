import fallbackMaterial from './fallbackMaterial.js';
import { getDefaultMaterialsSet } from './getDefaultMaterialsSet.js';
import { getMonitor } from './monitor.js';

function getDefaultMaterialId(core, type) {
    switch (type) {
        case 'body':
        case 'door':
        case 'edgebanding':
        case 'bodyEdgebanding':
        case 'doorEdgebanding':
        case 'fillerEdgebanding':
        case 'visibleCarcassEdgebanding':
        case 'finishEndEdgebanding':
        case 'topValanceEdgebanding':
        case 'bottomValanceEdgebanding':
        case 'topValance':
        case 'bottomValance':
        case 'toeKick':
        case 'filler':
        case 'finishEnd':
        case 'visiblePanel':
        case 'visibleCarcass':
            return getDefaultMaterialsSet(core)[type].get();
        case 'accessory':
        case 'hook':
        case 'tieRack':
        case 'stripLight':
        case 'slideOutLaundry':
        case 'pole':
        case 'doorInsert':
        case 'suspendedPole':
        case 'tiltOutHamper':
        case 'scarfRack':
        case 'beltRack':
        case 'hangingRail':
        case 'drawerSlideUndermount':
        case 'camLock':
        case 'ovvoLock':
        case 'shoeFence':
        case 'heelCatch':
            return core.storage.get('materials').arr[type] && core.storage.get('materials').arr[type].length
                ? core.storage.get('materials').arr[type][0]._id
                : fallbackMaterial._id;
        case 'melamineBox':
        case 'melamineBoxBottom':
        case 'doorInsertEdgebanding':
        case 'melamineBoxEdgebanding':
        case 'bottomFinishEnd':
        case 'doorStyle':
        case 'picture':
            //@TODO handle these types properly, missed from Vesta
            getMonitor().warn('Unsupported material type for default material', type);
            return fallbackMaterial._id;
        default:
            return core.projectSettings.materials.get(type).get();
    }
}

export { getDefaultMaterialId };
