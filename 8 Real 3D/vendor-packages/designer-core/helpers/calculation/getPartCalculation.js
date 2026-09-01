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
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import '../../components/Node/components/AdjustableBox/index.js';
import '../../components/Node/components/AdjustableExtrusion/index.js';
import '../../components/Node/components/BoxContainer/index.js';
import '../../components/Node/components/Carcass/index.js';
import '../../components/Node/components/Ceiling2D/index.js';
import '../../components/Node/components/Countertop/index.js';
import '../../components/Node/components/CrownMolding/index.js';
import '../../components/Node/components/Edgebanding/index.js';
import '../../components/Node/components/Floor2D/index.js';
import '../../components/Node/components/Frame/index.js';
import '../../components/Node/components/FreeBoxContainer/index.js';
import '../../components/Node/components/GateFrame/index.js';
import '../../components/Node/components/Glass/index.js';
import '../../components/Node/components/Image/index.js';
import '../../components/Node/components/Item/index.js';
import '../../components/Node/components/LaminateBox/index.js';
import '../../components/Node/components/MiteredPanel/index.js';
import '../../components/Node/BaseModel.js';
import '../../components/Node/components/Molding/index.js';
import '../../components/Node/components/MountLine/index.js';
import '../../components/Node/components/MountPlane/index.js';
import '../../components/Node/components/MountPoint/index.js';
import '../../components/Node/components/Panel/index.js';
import '../../components/Node/components/Part/index.js';
import '../../components/Node/components/Point/index.js';
import '../../components/Node/components/PointLight/index.js';
import '../../components/Node/components/RawPanel/index.js';
import '@preact/signals-react';
import '../cathedral/computeCathedralContext.js';
import '../../components/Node/components/ShapedBoxContainer/index.js';
import '../../components/Node/components/SpotLight/index.js';
import '../../components/Node/components/Tiles/index.js';
import '../../components/Node/components/ToeKickPanel/index.js';
import '../../components/Node/components/Valance/index.js';
import '../../components/Node/components/Wall2D/index.js';
import '../../components/Node/components/WindowFrame/index.js';
import '../../components/Node/helpers/effects.js';
import '../../components/Node/helpers/effects.reachInCloset.js';
import '../../components/Node/helpers/effects.wallHole.js';
import '../../components/Node/helpers/defaultHoleCurve.js';
import '../multiCloset/contentPartTypes.js';
import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import '../../components/Node/helpers/getResizableSides.js';
import '../../components/Node/helpers/getSelectableNode.js';
import '../math/plane/unitBoxCorners.js';
import '../math/plane/projectUnitBoxToFootprint2D.js';
import { getMaterial } from '../getMaterial.js';
import { baseEntry } from './internal/entry.js';

/**
 * Part → `{ parts }`.
 *
 * Emits size (`width * height` roll-up) + `partType`. The `materialId` is taken
 * from the part's first child `Panel` so that styled door parts carry the door
 * material — that is what the aggregate transform's door-style rule merges into
 * `panels`. Non-styled parts are summed into `parts` and then discarded by the
 * transform, so a missing material is harmless for them.
 *
 * TODO(phase2): the special part types (countertopPart / toeKickPart / soffitPart
 * / …) that vesta expanded into full item-level lines via `catalogPath` are not
 * handled here — core instantiated nodes carry no `catalogPath`.
 */
const getPartCalculation = (core, node) => {
    const partType = node.partType.get();
    if (!partType)
        return null;
    let materialId;
    const children = node.children.get();
    for (let i = 0; i < children.length; i += 1) {
        const child = getOptionalNode(core, children[i]);
        if (!child)
            continue;
        if (child.type === NodeType.Panel) {
            materialId = getMaterial(core, child.id)._id;
            break;
        }
    }
    return {
        parts: {
            ...baseEntry(core, node),
            materialId,
            partType,
            width: node.size.x.get(),
            height: node.size.y.get(),
            depth: node.size.z.get()
        }
    };
};

export { getPartCalculation };
