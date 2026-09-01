import getAttributeValue from '../getAttributeValue.js';
import getPropertyValue from '../getPropertyValue.js';
import { emptyCategoryCalculations } from './calculationCategories.js';
import { nodeName } from './internal/entry.js';

/**
 * Item → an `ItemCalculation` shell with empty category buckets. The buckets are
 * filled during grouping from the item's collected child `calculations`.
 *
 * `height` subtracts the toe-kick when the item has no separate toe-kick
 * present, matching vesta.
 *
 * TODO(phase2): `catalogPath`, `interiorOptions` and `extra.accessory` fan-out
 * are not sourced — those live on the vesta serialized config, not on the core
 * instantiated Item.
 */
const getItemCalculation = (_core, node) => {
    const toeKickPresent = Number(getAttributeValue(node, 'ToeKickPresent'));
    const toeKickHeight = Number(getAttributeValue(node, 'ToeKickHeight'));
    return {
        ...emptyCategoryCalculations(),
        uuid: node.id,
        itemType: node.itemType.get(),
        itemNumber: Number(getPropertyValue(node, 'itemNumber')) || 0,
        name: nodeName(node),
        comment: String(getPropertyValue(node, 'comment') || ''),
        width: node.size.x.get(),
        height: node.size.y.get() - (toeKickPresent ? 0 : toeKickHeight),
        depth: node.size.z.get(),
        calculations: []
    };
};

export { getItemCalculation };
