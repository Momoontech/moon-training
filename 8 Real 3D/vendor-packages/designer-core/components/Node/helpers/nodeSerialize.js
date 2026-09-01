import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import '../../../declarations/helpers.js';
import { V3Axes } from '../../../declarations/InterpretedLine.js';
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

/**
 * Serialize a `Record<V3Axes, Value<number>>` to a plain `{ x, y, z }` for `toJSON()`.
 * Uses `getSignal()` to preserve formula references rather than resolved values.
 */
const serializeV3 = (v) => ({
    x: v[V3Axes.x].getSignal(),
    y: v[V3Axes.y].getSignal(),
    z: v[V3Axes.z].getSignal()
});

export { serializeV3 };
