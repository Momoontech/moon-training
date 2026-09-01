import getMaterialById from '../getMaterialById.js';
import { baseEntry } from './internal/entry.js';

/**
 * Glass → `{ glass }`.
 *
 * Core `Glass` carries `size` + `materialId` (no `shape`, no `grainDirection`),
 * so the area is the rectangular `size.x * size.y` (vesta derived it from the
 * glass polygon; core has no polygon here). Thickness comes from the resolved
 * glass material.
 */
const getGlassCalculation = (core, node) => {
    const materialId = node.materialId.get();
    const width = node.size.x.get();
    const height = node.size.y.get();
    const material = getMaterialById(core, materialId, ['glass', 'windowGlass', 'doorGlass', 'mirror']);
    return {
        glass: {
            ...baseEntry(core, node),
            materialId,
            materialThickness: material.thickness ?? 0,
            grainDirection: 0,
            area: width * height,
            rectArea: width * height,
            width,
            height
        }
    };
};

export { getGlassCalculation };
