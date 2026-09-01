import getParentPanel from '../../components/Node/helpers/getParentPanel.js';
import { getMaterials } from '../getMaterial.js';
import { baseEntry } from './internal/entry.js';
import { shapeEdgeLengths } from './internal/shapeGeometry.js';

/**
 * Edgebanding → `{ edgebandings }` (one entry per banded edge).
 *
 * `getMaterials(core, edgebandingId)` resolves the per-edge material list from
 * the parent panel's `edgeMaterialIds` (returning `null` for un-banded edges).
 * Each edge's `width` is the length of the matching segment of the parent panel's
 * shape — from `shapeEdgeLengths`, which is indexed per curve point so it stays
 * aligned with `edgeMaterialIds` even when arc/bezier edges tessellate into many
 * points (the core analogue of vesta's per-edge `contour.curves[i].getLength()`).
 */
const getEdgebandingCalculation = (core, node) => {
    const materials = getMaterials(core, node.id);
    if (!materials.length)
        return null;
    const panel = getParentPanel(core, node.id);
    const edgeLengths = shapeEdgeLengths(core, panel.shape);
    const edgebandingType = node.edgebandingType.get();
    const base = baseEntry(core, node);
    const entries = [];
    for (let i = 0; i < materials.length; i += 1) {
        const material = materials[i];
        if (!material)
            continue;
        const width = edgeLengths[i] ?? 0;
        entries.push({
            ...base,
            materialId: material._id,
            materialThickness: material.thickness ?? 0,
            width,
            edgebandingType
        });
    }
    return entries.length ? { edgebandings: entries } : null;
};

export { getEdgebandingCalculation };
