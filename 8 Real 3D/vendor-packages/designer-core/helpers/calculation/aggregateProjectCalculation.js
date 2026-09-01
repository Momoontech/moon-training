import { CATEGORY_KEYS, quantityOf } from './calculationCategories.js';

/** Categories folded into `panels` (and then removed) by the transform. */
const VALANCE_FOLD_KEYS = ['toeKicks', 'topValances', 'bottomValances'];
/**
 * Port of moon-vesta `getCalculationOnUpdateProject` — the aggregate transform.
 *
 * 1. strip each item's `calculations` list;
 * 2. roll every category up into a per-material `{ quantity }` map (`quantityOf`
 *    keeps the exact vesta math: area / width / width*height / unit / width-or-one);
 * 3. merge styled-door `parts` into `panels` (door-style materials only), then
 *    drop `parts`;
 * 4. fold `toeKicks` / `topValances` / `bottomValances` quantities into `panels`,
 *    then empty them.
 *
 * Door-style detection uses the same materials `doorStyle` table vesta read via
 * `Storage.get('materials').obj.doorStyle`, here `core.storage.get('materials')`
 * (null-guarded — tests may leave storage empty).
 */
const aggregateProjectCalculation = (core, grouped) => {
    const perItemOut = grouped.perItem.map((item) => {
        const copy = { ...item };
        delete copy.calculations;
        return copy;
    });
    const full = {};
    for (const key of CATEGORY_KEYS) {
        const entries = grouped.perProject[key];
        const map = {};
        for (const entry of entries) {
            const materialId = entry.materialId;
            if (!materialId)
                continue;
            if (!map[materialId])
                map[materialId] = { quantity: 0 };
            map[materialId].quantity += quantityOf(key, entry);
        }
        full[key] = map;
    }
    // Styled door parts are calculated "per styled part" but counted as panels.
    const storageMaterials = core.storage.get('materials')?.obj;
    for (const materialId of Object.keys(full.parts)) {
        if (storageMaterials?.doorStyle?.[materialId]) {
            if (full.panels[materialId]) {
                full.panels[materialId].quantity += full.parts[materialId].quantity;
            }
            else {
                full.panels[materialId] = full.parts[materialId];
            }
        }
    }
    // Fold valance / toe-kick quantities into panels.
    for (const key of VALANCE_FOLD_KEYS) {
        const map = full[key];
        for (const materialId of Object.keys(map)) {
            full.panels[materialId] = {
                quantity: (full.panels[materialId]?.quantity || 0) + map[materialId].quantity
            };
        }
    }
    const { parts, toeKicks, topValances, bottomValances, ...summary } = full;
    return { perItem: perItemOut, perProject: summary };
};

export { aggregateProjectCalculation };
