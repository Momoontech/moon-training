import fallbackMaterial from './fallbackMaterial.js';
import { getDefaultMaterialId } from './getDefaultMaterialId.js';
import { getMonitor } from './monitor.js';

function getMaterialById(core, id, materialType) {
    const materials = core.storage.get('materials');
    let result;
    const mType = Array.isArray(materialType)
        ? materialType
        : materialType === 'door' || materialType === 'finishEnd'
            ? [materialType, 'doorStyle']
            : materialType;
    if (Array.isArray(mType)) {
        for (let i = 0; i < mType.length; i += 1) {
            if (id) {
                if (!materials.obj[mType[i]]) {
                    getMonitor().warn('getMaterialById: missing materials bucket for type', mType[i]);
                    continue;
                }
                result = materials.obj[mType[i]][id];
                if (result) {
                    break;
                }
            }
        }
    }
    else {
        if (!materials.obj[mType]) {
            getMonitor().warn('getMaterialById: missing materials bucket for type', mType);
        }
        result = (id ? materials.obj[mType]?.[id] : undefined) || materials.obj[mType]?.[getDefaultMaterialId(core, mType)];
    }
    return JSON.parse(JSON.stringify(result || fallbackMaterial));
}

export { getMaterialById as default };
