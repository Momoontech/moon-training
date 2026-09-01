import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import { ModelType } from '../../declarations/Model.js';
import '../../declarations/Molding.js';
import '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getMaterial } from '../getMaterial.js';
import { baseEntry } from './internal/entry.js';

/**
 * Model → hardware bucket, by `modelType`:
 *   pull → handles · leg → legs · hinge → hinges · drawerSystem → drawerSystems ·
 *   drawerSlide / drawerSlideUndermount → drawerSlides · everything else → accessories.
 * Appliance models emit no BOM line (vesta returned no material for them).
 *
 * `getMaterial` handles the per-type material resolution (incl. hinge → hingeType).
 */
const getModelCalculation = (core, node) => {
    if (node.modelType === ModelType.applianceModel)
        return null;
    const material = getMaterial(core, node.id);
    const base = { ...baseEntry(core, node), materialId: material._id };
    switch (node.modelType) {
        case ModelType.pull:
            return { handles: base };
        case ModelType.leg:
            return { legs: base };
        case ModelType.hinge:
            return { hinges: { ...base, hingeType: node.hingeType.get() } };
        case ModelType.drawerSystem:
            return { drawerSystems: base };
        case ModelType.drawerSlide:
        case ModelType.drawerSlideUndermount:
            return { drawerSlides: base };
        default: {
            const width = 'size' in node && node.size ? node.size.x.get() : undefined;
            return { accessories: { ...base, ...(width !== undefined ? { width } : {}) } };
        }
    }
};

export { getModelCalculation };
