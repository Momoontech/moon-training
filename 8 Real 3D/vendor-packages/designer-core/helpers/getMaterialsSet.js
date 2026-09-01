import getNode from '../components/Node/helpers/getNode.js';
import getParentItem from '../components/Node/helpers/getParentItem.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import { getMonitor } from './monitor.js';
import { getClosetMaterialsSetById } from './getClosetMaterialsSetById.js';
import { getDefaultMaterialsSet } from './getDefaultMaterialsSet.js';
import getMaterialsSetById from './getMaterialsSetById.js';
import getPropertyValue from './getPropertyValue.js';
import { getStockMaterialsSetById } from './getStockMaterialsSetById.js';

function getMaterialsSet(core, nodeId) {
    const node = getNode(core, nodeId);
    if (node.type === NodeType.Item) {
        if (node && node.itemType.get() === 'stockCabinet') {
            return getStockMaterialsSetById(core, node.materialsSet.get());
        }
        if (node && (getPropertyValue(node, 'isSingleCloset') || getPropertyValue(node, 'isMultiCloset'))) {
            return getClosetMaterialsSetById(core, node.materialsSet.get());
        }
        return getMaterialsSetById(core, node.materialsSet.get());
    }
    else {
        const item = getParentItem(core, node.id);
        if (item) {
            if (item && item.itemType.get() === 'stockCabinet') {
                return getStockMaterialsSetById(core, item.materialsSet.get());
            }
            if (item && (getPropertyValue(item, 'isSingleCloset') || getPropertyValue(item, 'isMultiCloset'))) {
                return getClosetMaterialsSetById(core, item.materialsSet.get());
            }
            return getMaterialsSetById(core, item.materialsSet.get());
        }
        else {
            getMonitor().warn('Calculating materials set for incorrect type of object');
            return getDefaultMaterialsSet(core);
        }
    }
}

export { getMaterialsSet as default };
