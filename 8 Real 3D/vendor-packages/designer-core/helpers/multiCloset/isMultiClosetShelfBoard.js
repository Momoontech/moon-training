import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
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
import { PartType, MultiClosetStackType } from '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getCategoryForStackPartType } from './contentPartTypes.js';

/**
 * Whether `node` is an adjustable shelf BOARD: a `freeBoxContainerInteriorPart`
 * (fix-shelf divider) whose parent is a SHELVES stack. Only these boards MOVE
 * (reallocating 32mm holes between the compartments above/below); bay dividers
 * (parent = `FreeBoxContainer`) and drawer/hanger-stack dividers are NOT boards.
 *
 * Single source of truth shared by the editor3D selection drill-down
 * (`getSelectableNode`) and the front-elevation overlay classifier
 * (`Editor2DUI/SelectionOverlayUI` → `getSelectionKind`).
 *
 * The parent test reads the stack's `multiClosetStackType` through
 * `getCategoryForStackPartType(parent)` — NOT its `partType`, which is the
 * category-blind `multiClosetStackPart` and would match a drawer stack just as
 * happily.
 */
const isMultiClosetShelfBoard = (core, node) => {
    if (node.type !== NodeType.Part || node.partType.get() !== PartType.freeBoxContainerInteriorPart) {
        return false;
    }
    const parent = getOptionalNode(core, node.parent.get());
    return (!!parent &&
        parent.type === NodeType.Part &&
        getCategoryForStackPartType(parent) === MultiClosetStackType.multiClosetShelvesStackPart);
};

export { isMultiClosetShelfBoard };
