import { aggregateProjectCalculation } from './aggregateProjectCalculation.js';
import { CATEGORY_KEYS } from './calculationCategories.js';
import { collectNodeCalculations } from './collectNodeCalculations.js';
import { getPerPartCalculations } from './getPerPartCalculations.js';
import { groupItemCalculations } from './groupItemCalculations.js';
import { groupProjectCalculations } from './groupProjectCalculations.js';

/**
 * Project-wide calculation orchestrator — the core analogue of the vesta
 * `getCalculations()` → `getCalculationOnUpdateProject()` pipeline, as one
 * composed call over `core.nodes` (traversed from `core.rootId`):
 *
 *   traverse + per-node generate → group per item → group per project
 *   (+ itemNumber) → aggregate transform (per-material roll-up, door-style
 *   merge, valance/toe-kick fold).
 *
 * Returns clean core-native `CalculationResult`. Closet / multiCloset items are
 * excluded from `perItem`/`perProject` and reported in `perPart` (vesta's per-part
 * pass). This is a one-shot read (not reactive).
 */
const getCalculations = (core) => {
    const { perItemById, perProject, closetItemIds } = collectNodeCalculations(core);
    const perItem = [];
    for (const itemCalc of perItemById.values()) {
        const grouped = groupItemCalculations(itemCalc.calculations, CATEGORY_KEYS);
        perItem.push({ ...itemCalc, ...grouped });
    }
    const groupedPerProject = groupProjectCalculations(core, perProject, CATEGORY_KEYS);
    const { perItem: perItemOut, perProject: perProjectOut } = aggregateProjectCalculation(core, {
        perItem,
        perProject: groupedPerProject
    });
    const perPart = getPerPartCalculations(core, closetItemIds);
    return { perItem: perItemOut, perProject: perProjectOut, perPart };
};

export { getCalculations };
