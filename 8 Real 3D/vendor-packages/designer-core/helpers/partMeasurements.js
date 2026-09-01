import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import { VectorProps, V3Axes } from '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import '../declarations/Node.js';
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
import '../components/Node/components/AdjustableBox/index.js';
import '../components/Node/components/AdjustableExtrusion/index.js';
import '../components/Node/components/BoxContainer/index.js';
import '../components/Node/components/Carcass/index.js';
import '../components/Node/components/Ceiling2D/index.js';
import '../components/Node/components/Countertop/index.js';
import '../components/Node/components/CrownMolding/index.js';
import '../components/Node/components/Edgebanding/index.js';
import '../components/Node/components/Floor2D/index.js';
import '../components/Node/components/Frame/index.js';
import '../components/Node/components/FreeBoxContainer/index.js';
import '../components/Node/components/GateFrame/index.js';
import '../components/Node/components/Glass/index.js';
import '../components/Node/components/Image/index.js';
import '../components/Node/components/Item/index.js';
import '../components/Node/components/LaminateBox/index.js';
import '../components/Node/components/MiteredPanel/index.js';
import '../components/Node/BaseModel.js';
import '../components/Node/components/Molding/index.js';
import '../components/Node/components/MountLine/index.js';
import '../components/Node/components/MountPlane/index.js';
import '../components/Node/components/MountPoint/index.js';
import '../components/Node/components/Panel/index.js';
import '../components/Node/components/Part/index.js';
import '../components/Node/components/Point/index.js';
import '../components/Node/components/PointLight/index.js';
import '../components/Node/components/RawPanel/index.js';
import '@preact/signals-react';
import './cathedral/computeCathedralContext.js';
import '../components/Node/components/ShapedBoxContainer/index.js';
import '../components/Node/components/SpotLight/index.js';
import '../components/Node/components/Tiles/index.js';
import '../components/Node/components/ToeKickPanel/index.js';
import '../components/Node/components/Valance/index.js';
import '../components/Node/components/Wall2D/index.js';
import '../components/Node/components/WindowFrame/index.js';
import '../components/Node/helpers/effects.js';
import '../components/Node/helpers/effects.reachInCloset.js';
import '../components/Node/helpers/effects.wallHole.js';
import '../components/Node/helpers/defaultHoleCurve.js';
import './multiCloset/contentPartTypes.js';
import getOptionalParentItem from '../components/Node/helpers/getOptionalParentItem.js';
import '../components/Node/helpers/getResizableSides.js';
import getItem from '../components/Node/helpers/getItem.js';
import getPart from '../components/Node/helpers/getPart.js';
import '../components/Node/helpers/getSelectableNode.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';
import SetNodeVectorComponentCommand from '../components/commands/SetNodeVectorComponentCommand.js';

// TODO: use vesta limit logic for this
const SIZES_CONFIG = {
    DEPTH: { MIN: 12, MAX: 48 },
    WIDTH: { MIN: 9, MAX: 48 }
};
const getPartSizeLimits = (core, part) => {
    let maxWidth = SIZES_CONFIG.WIDTH.MAX;
    const parentId = part.parent.get();
    const parent = getOptionalParentItem(core, parentId);
    if (!parent)
        return {
            width: { min: SIZES_CONFIG.WIDTH.MIN, max: SIZES_CONFIG.WIDTH.MAX },
            height: { min: 1, max: null },
            depth: { min: SIZES_CONFIG.DEPTH.MIN, max: SIZES_CONFIG.DEPTH.MAX }
        };
    const parentWidth = parent.size.x.get();
    const sectionIds = parent.sections?.get() ?? [];
    let otherFixedSum = 0;
    let equalCount = 0;
    for (const secId of sectionIds) {
        if (secId === part.id)
            continue;
        const sec = getPart(core, secId);
        const isAuto = (sec.isAutoSized?.get() ?? 0) === 1;
        if (isAuto) {
            equalCount += 1;
        }
        else {
            otherFixedSum += sec.size.x.get();
        }
    }
    maxWidth = parentWidth - otherFixedSum - equalCount * SIZES_CONFIG.WIDTH.MIN;
    return {
        width: { min: SIZES_CONFIG.WIDTH.MIN, max: maxWidth },
        height: { min: 1, max: null },
        depth: { min: SIZES_CONFIG.DEPTH.MIN, max: SIZES_CONFIG.DEPTH.MAX }
    };
};
// ---------------------------------------------------------------------------
// Command builders
// ---------------------------------------------------------------------------
/**
 * Build a command to resize a Part (section) on a single axis.
 *
 * Uses SetNodeVectorComponentCommand (single axis) instead of
 * SetNodeVector3Command (all 3 axes) to preserve formulas on untouched axes.
 * Part sizes often reference the parent Item via formula tokens like
 * `productSize.z` — overwriting all axes would destroy those links.
 *
 * Width: clamped to WIDTH.MIN and available space in parent multi-closet.
 * Height: no upper bound (just > 0).
 * Depth: clamped to DEPTH.MIN / DEPTH.MAX.
 */
const setPartSize = (core, part, axis, val) => {
    if (val <= 0)
        return null;
    if (axis === 'width') {
        if (val < SIZES_CONFIG.WIDTH.MIN)
            return null;
        const parentId = part.parent.get();
        if (!parentId)
            return null;
        const parent = getItem(core, parentId);
        const parentWidth = parent.size.x.get();
        const sectionIds = parent.sections?.get() ?? [];
        let otherFixedSum = 0;
        let equalCount = 0;
        for (const secId of sectionIds) {
            if (secId === part.id)
                continue;
            const sec = getPart(core, secId);
            const isAuto = (sec.isAutoSized?.get() ?? 0) === 1;
            if (isAuto) {
                equalCount += 1;
            }
            else {
                otherFixedSum += sec.size.x.get();
            }
        }
        const maxWidth = parentWidth - otherFixedSum - equalCount * SIZES_CONFIG.WIDTH.MIN;
        if (val > maxWidth)
            return null;
        return new SetNodeVectorComponentCommand(part.id, VectorProps.size, V3Axes.x, val);
    }
    if (axis === 'height') {
        return new SetNodeVectorComponentCommand(part.id, VectorProps.size, V3Axes.y, val);
    }
    // depth
    const clampedDepth = Math.max(SIZES_CONFIG.DEPTH.MIN, Math.min(SIZES_CONFIG.DEPTH.MAX, val));
    return new SetNodeVectorComponentCommand(part.id, VectorProps.size, V3Axes.z, clampedDepth);
};

export { getPartSizeLimits, setPartSize };
