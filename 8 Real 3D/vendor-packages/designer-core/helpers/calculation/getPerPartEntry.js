import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import getOptionalParentWall2D from '../../components/Node/helpers/getOptionalParentWall2D.js';
import getParentItem from '../../components/Node/helpers/getParentItem.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import { NodeType } from '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import { PartType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getAttributeValue from '../getAttributeValue.js';
import { getMaterial } from '../getMaterial.js';
import getPropertyValue from '../getPropertyValue.js';
import { emptyCategoryCalculations } from './calculationCategories.js';
import { nodeName } from './internal/entry.js';

/** materialId of the first direct child `Panel`, if any (matches getPartCalculation). */
const firstChildPanelMaterialId = (core, node) => {
    if (!('children' in node))
        return undefined;
    const children = node.children.get();
    for (let i = 0; i < children.length; i += 1) {
        const child = getOptionalNode(core, children[i]);
        if (child && child.type === NodeType.Panel)
            return getMaterial(core, child.id)._id;
    }
    return undefined;
};
/** Wall number of the owning wall's RoomSegment (`WallNumber` attribute), if wall-mounted. */
const wallNumberOf = (core, nodeId) => {
    const wall2D = getOptionalParentWall2D(core, nodeId);
    if (!wall2D)
        return undefined;
    const segment = getOptionalNode(core, wall2D.parent.get());
    if (!segment)
        return undefined;
    return Number(getAttributeValue(segment, 'WallNumber')) || undefined;
};
/**
 * Builds a `perPart` entry for a qualifying closet Part/Panel/Molding — the
 * core analogue of vesta's `Part.getCalculation('perPart')`. Child components
 * are attached later by `getPerPartCalculations`; here we only produce the base
 * part with empty category arrays.
 */
const getPerPartEntry = (core, node) => {
    const item = getParentItem(core, node.id);
    const parent = getOptionalNode(core, node.parent.get());
    const partType = 'partType' in node ? String(node.partType.get() ?? '') : '';
    let width;
    let height;
    let depth;
    if ('size' in node) {
        const size = node.size;
        const sx = size.x.get();
        const sy = size.y.get();
        const sz = size.z.get();
        // `shelf` reports its board footprint (depth is the vertical axis) — matches vesta.
        if (partType === PartType.shelf) {
            width = sx;
            height = sz;
            depth = sy;
        }
        else {
            width = sx;
            height = sy;
            depth = sz;
        }
    }
    // A Panel root carries its own material; a Part root inherits from its first child Panel.
    const materialId = node.type === NodeType.Panel ? getMaterial(core, node.id)._id : firstChildPanelMaterialId(core, node);
    const wallNumber = wallNumberOf(core, node.id);
    const systemId = item.system?.get() || undefined;
    const catalogPath = String(getPropertyValue(node, 'catalogPath') || '') || undefined;
    // StripLightsPresent: from the item, gated by this part's TopShelf / FixShelf flags.
    const topShelf = getAttributeValue(node, 'TopShelf');
    const fixShelf = getAttributeValue(node, 'FixShelf');
    const stripLights = topShelf
        ? getAttributeValue(item, 'TopStripLightsPresent')
        : fixShelf
            ? getAttributeValue(item, 'FixShelfStripLightsPresent')
            : undefined;
    const drawerBoxHeight = Number(getAttributeValue(node, 'DrawerBoxHeight')) || undefined;
    const attributes = {
        StripLightsPresent: !!stripLights,
        ...(drawerBoxHeight ? { DrawerBoxHeight: drawerBoxHeight } : {})
    };
    return {
        ...emptyCategoryCalculations(),
        uuid: node.id,
        itemId: item.id,
        parentId: node.parent.get(),
        partType,
        // Prefer the node's own name; fall back to the parent Part's name only when the node is
        // unnamed. Item parts (e.g. multiClosetDrawerPart) are named and must NOT inherit the stack
        // container's name — the earlier "always use the parent Part's name" rule mistakenly did.
        name: nodeName(node) || (parent && parent.type === NodeType.Part ? nodeName(parent) : ''),
        ...(catalogPath ? { catalogPath } : {}),
        itemNumber: [Number(getPropertyValue(item, 'itemNumber')) || 0],
        ...(wallNumber !== undefined ? { wallNumber } : {}),
        ...(systemId !== undefined ? { systemId } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        ...(depth !== undefined ? { depth } : {}),
        ...(materialId ? { materialId } : {}),
        attributes
    };
};

export { getPerPartEntry };
