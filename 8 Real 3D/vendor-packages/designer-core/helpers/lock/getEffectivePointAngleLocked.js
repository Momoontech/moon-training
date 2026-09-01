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
import getRoomSegmentsByPoint from '../getRoomSegmentsByPoint.js';

/**
 * Reads the **effective** angle-locked state of a corner. The result
 * drives the angle badge's (`AngularDimension`) commit gate in
 * `FloorPlanUI/AnglesUI` and (in tandem with
 * `getEffectivePointPositionLocked`) the per-arrow disabled flags
 * forwarded down to the badge.
 *
 * **Angle is locked when ANY of:**
 *
 * 1. The corner's own `isAngleLocked` property signal is `true` — the
 *    user explicitly locked the angle via the toolbar (a
 *    `SetNodePropertyValueCommand(pointId, 'isAngleLocked', true)` —
 *    the preferred channel for `properties` writes; typically paired
 *    with a sibling `SetNodePropertyValueCommand(pointId, 'isLocked',
 *    true)` inside one `runCommandsAsTransaction` so the locked
 *    angle's vertex cannot drift while its arms stay anchored to the
 *    angle constraint).
 * 2. **Both** adjacent room segments have `isLocked === true`. Two
 *    anchored arms cannot pivot around the corner without moving an
 *    endpoint, and every endpoint is pinned by its own segment lock —
 *    so the angle has no remaining DoF.
 *
 * **Asymmetry vs `getEffectivePointPositionLocked` is intentional.**
 * The position helper uses the looser ANY-adjacent-locked rule (one
 * anchored wall already removes the corner's translational DoF). The
 * angle helper sticks with the stricter BOTH-adjacent rule because, by
 * the spec:
 *
 *   > When we lock a wall: ... the user can still select [the corner]
 *   > in order to change the angle.
 *
 * With one free arm the user can pivot it around the now-anchored
 * corner — the angle is still editable, just constrained to "moving
 * endpoint must be on the unlocked arm". That single-anchor constraint
 * is expressed per-arrow on the badge (see `getEffectivePointDirection`
 * / `useEffectivePointDirection`), not as full angle-lock.
 *
 * **Falsy paths:**
 *
 * - The id does not resolve to a `Point` — return `false`.
 * - The corner has fewer than 2 adjacent segments — there is no angle
 *   to lock yet (drawing-in-progress / disconnected geometry). The
 *   explicit flag, if set, still wins; the segment-pair rule trivially
 *   does not fire.
 *
 * Allocation-free / side-effect-free — safe inside `useComputedValue`.
 */
const getEffectivePointAngleLocked = (core, pointId) => {
    const point = getNode(core, pointId);
    if (point.type !== NodeType.Point)
        return false;
    if (point.properties.get('isAngleLocked')?.get() === true)
        return true;
    const adjacentSegmentIds = getRoomSegmentsByPoint(core, pointId);
    if (adjacentSegmentIds.length < 2)
        return false;
    for (const segmentId of adjacentSegmentIds) {
        const segment = getNode(core, segmentId);
        if (segment.type !== NodeType.RoomSegment)
            return false;
        if (segment.properties.get('isLocked')?.get() !== true)
            return false;
    }
    return true;
};

export { getEffectivePointAngleLocked };
