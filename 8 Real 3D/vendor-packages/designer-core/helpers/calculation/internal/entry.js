import getOptionalParentItem from '../../../components/Node/helpers/getOptionalParentItem.js';
import getPropertyValue from '../../getPropertyValue.js';

/** Read a node's `name` property, or '' if the node carries no `properties` map. */
const nodeName = (node) => 'properties' in node ? String(getPropertyValue(node, 'name') || '') : '';
/**
 * Common identity fields for a calculation line. `itemId` is the nearest
 * ancestor `Item` (via `getOptionalParentItem`) — the core analogue of vesta's
 * `getSceneObject(id).getItem()`; falls back to the direct parent when the node
 * is not under an Item (e.g. isolated unit-test nodes). `itemNumber` starts empty
 * and is assigned during per-project grouping.
 */
const baseEntry = (core, node) => {
    const item = getOptionalParentItem(core, node.id);
    return {
        uuid: node.id,
        itemId: (item?.id ?? node.parent.get()),
        parentId: node.parent.get(),
        name: nodeName(node),
        itemNumber: []
    };
};

export { baseEntry, nodeName };
