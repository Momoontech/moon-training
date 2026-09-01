import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import getPropertyValue from '../../getPropertyValue.js';

/**
 * A closet item is routed to `perPart` (not `perItem`/`perProject`). This covers
 * the property-flagged closets (`isSingleCloset` / `isMultiCloset`, set by the
 * vesta importer) AND the native `itemType === multiCloset` (which a UI-created
 * multiCloset carries WITHOUT the property, so the itemType check is required).
 *
 * `reachInCloset` is intentionally NOT included — it is a room-like closet that
 * spawns a dependent Room and holds no Parts.
 */
const isClosetItem = (item) => !!getPropertyValue(item, 'isSingleCloset') ||
    !!getPropertyValue(item, 'isMultiCloset') ||
    item.itemType.get() === ItemType.multiCloset;

export { isClosetItem };
