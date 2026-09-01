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
import { PanelType } from '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import getAttributeValue from '../getAttributeValue.js';
import { getMaterial } from '../getMaterial.js';
import { baseEntry } from './internal/entry.js';
import { shapeBounds, shapeArea } from './internal/shapeGeometry.js';

/**
 * Panel / MiteredPanel → `{ panels }`.
 *
 * A `Panel` carries a `shape` (area / bounds), `grainDirection`, `panelType`
 * and a resolvable material (`getMaterial` handles the doorStyle / melamineBox /
 * doorInsert resolution). A `MiteredPanel` in core has none of those — only
 * `size` — so it emits a size-derived line with no material (TODO(phase2):
 * source a mitered-panel material); with no `materialId` the roll-up skips it.
 *
 * Styled single-piece door panels are NOT counted as panels — they are counted
 * via their parent `Part` and merged into panels by the door-style rule in the
 * aggregate transform. This mirrors vesta's `doorStyle && calcType !== 'Five Piece'`
 * skip.
 */
const getPanelCalculation = (core, node) => {
    const isMitered = node.type === NodeType.MiteredPanel;
    let materialId;
    let materialThickness = 0;
    let materialType = '';
    if (!isMitered) {
        const material = getMaterial(core, node.id);
        if (material.doorStyle && material.calcType !== 'Five Piece')
            return null;
        materialId = material._id;
        materialThickness = material.thickness ?? 0;
        materialType = material.subCategory2 ?? '';
    }
    else {
        materialThickness = node.size.z.get();
    }
    let width;
    let height;
    let area;
    if ('shape' in node) {
        const bounds = shapeBounds(core, node.shape);
        width = bounds.width;
        height = bounds.height;
        area = shapeArea(core, node.shape);
    }
    else {
        width = node.size.x.get();
        height = node.size.y.get();
        area = width * height;
    }
    const grainDirection = 'grainDirection' in node ? node.grainDirection.get() : 0;
    // Vesta swaps the grain-relative width/height when the grain runs across (90°).
    if (grainDirection === 90) {
        const swap = width;
        width = height;
        height = swap;
    }
    const panel = {
        ...baseEntry(core, node),
        materialId,
        panelType: 'panelType' in node ? node.panelType.get() : PanelType.body,
        materialType,
        materialThickness,
        grainDirection,
        area,
        rectArea: width * height,
        width,
        height,
        ...(node.attributes.has('LeftDrillingDepth')
            ? { leftDrillingDepth: Number(getAttributeValue(node, 'LeftDrillingDepth')) }
            : {}),
        ...(node.attributes.has('RightDrillingDepth')
            ? { rightDrillingDepth: Number(getAttributeValue(node, 'RightDrillingDepth')) }
            : {})
    };
    return { panels: panel };
};

export { getPanelCalculation };
