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
import getNode from '../../components/Node/helpers/getNode.js';
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
import '../../components/Node/helpers/getResizableSides.js';
import '../../components/Node/helpers/getSelectableNode.js';
import '../math/plane/unitBoxCorners.js';
import '../math/plane/projectUnitBoxToFootprint2D.js';
import { getEffectivePointPositionLocked } from './getEffectivePointPositionLocked.js';

/**
 * Reads the **drag-locked** state of a wall segment — `true` when the
 * segment cannot be moved as a rigid body via the perpendicular wall
 * drag in `RoomSegment.tsx`.
 *
 * **Drag is locked when ANY of:**
 *
 * 1. The segment's own `isLocked` property signal is `true` — same as
 *    `getEffectiveSegmentLocked`.
 * 2. Either endpoint is **effectively** position-locked
 *    ({@link getEffectivePointPositionLocked}). Spec:
 *
 *    > When we lock a wall: We can consider this as locking the
 *    > position of both corner points. Those corner points should no
 *    > longer be able to move.
 *
 *    The contrapositive enforced here: if a corner is effectively
 *    locked — by its own flag, or by being shared with ANOTHER locked
 *    wall — then translating this segment (which would move that
 *    corner) is forbidden.
 *
 * **Why a separate helper from `getEffectiveSegmentLocked`.**
 * `getEffectiveSegmentLocked` is consumed by
 * {@link getEffectiveSegmentDirection} to decide when **both**
 * direction arrows on the wall-length badge are disabled. Promoting
 * "any endpoint locked → segment locked" into that helper would
 * disable both arrows whenever a single endpoint is locked — but the
 * spec lets the user still edit the wall's length through the FREE
 * endpoint (the per-arrow disable on the busy side is what
 * `getEffectiveSegmentDirection` already produces). The drag gate is
 * the only seam that needs the stricter "any endpoint" rule, so it
 * gets its own helper.
 *
 * Allocation-free / side-effect-free — safe inside `useComputedValue`.
 */
const getEffectiveSegmentDragLocked = (core, segmentId) => {
    const segment = getNode(core, segmentId);
    if (segment.type !== NodeType.RoomSegment)
        return false;
    if (segment.properties.get('isLocked')?.get() === true)
        return true;
    if (getEffectivePointPositionLocked(core, segment.from.get()))
        return true;
    if (getEffectivePointPositionLocked(core, segment.to.get()))
        return true;
    return false;
};

export { getEffectiveSegmentDragLocked };
