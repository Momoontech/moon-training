import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import getPropertyValue from '../getPropertyValue.js';
import { emptyCategoryCalculations } from './calculationCategories.js';

/**
 * Concatenate every node slice into project-level category arrays, assigning
 * each entry its owning item's `itemNumber`.
 *
 * Reworked from vesta: it read `getSceneObject(id).getItem().getConfig().itemNumber`;
 * core reads the number straight off the owning `Item`'s `properties` map (each
 * entry already carries `itemId`, resolved to the ancestor Item during generation).
 * The sort is numeric (`(a,b) => a-b`) rather than vesta's default lexicographic
 * sort, which mis-ordered `itemNumber` arrays once an item index reached ≥ 10.
 */
const groupProjectCalculations = (core, perProject, categories) => {
    const result = emptyCategoryCalculations();
    const bucket = result;
    const itemNumberOf = (id) => {
        const node = getOptionalNode(core, id);
        if (!node || !('properties' in node))
            return 0;
        return Number(getPropertyValue(node, 'itemNumber')) || 0;
    };
    for (let i = 0; i < perProject.length; i += 1) {
        const slice = perProject[i];
        for (let c = 0; c < categories.length; c += 1) {
            const key = categories[c];
            const value = slice[key];
            if (!value)
                continue;
            if (key === 'edgebandings') {
                for (const edge of value) {
                    edge.itemNumber = [itemNumberOf(edge.itemId)];
                    bucket.edgebandings.push(edge);
                }
            }
            else {
                const entry = value;
                const mergedIds = entry.mergedIds;
                entry.itemNumber = (mergedIds && mergedIds.length ? mergedIds.map(itemNumberOf) : [itemNumberOf(entry.itemId)]).sort((a, b) => a - b);
                bucket[key].push(entry);
            }
        }
    }
    return result;
};

export { groupProjectCalculations };
