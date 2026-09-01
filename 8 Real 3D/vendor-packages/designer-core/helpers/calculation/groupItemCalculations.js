import { emptyCategoryCalculations } from './calculationCategories.js';

/**
 * Concatenate a set of per-node slices into one item's category arrays.
 * `edgebandings` slices hold arrays (flattened); every other category holds a
 * single entry. Pure — a 1:1 port of vesta's `groupItemCalculations`.
 */
const groupItemCalculations = (slices, categories) => {
    const result = emptyCategoryCalculations();
    const bucket = result;
    for (let i = 0; i < slices.length; i += 1) {
        const slice = slices[i];
        for (let c = 0; c < categories.length; c += 1) {
            const key = categories[c];
            const value = slice[key];
            if (!value)
                continue;
            if (key === 'edgebandings') {
                bucket.edgebandings.push(...value);
            }
            else {
                bucket[key].push(value);
            }
        }
    }
    return result;
};

export { groupItemCalculations };
