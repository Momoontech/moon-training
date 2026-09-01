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
 * Reads the **effective** position-locked state of a corner — combining
 * the point's own `isLocked` flag with a derived rule based on its
 * adjacent segments. The result drives the drag gate in
 * `RoomPointsUI/RoomPoint`, the length-input read-only flag in
 * `FloorPlanUI/DimensionsUI`, and the per-arrow CW / CCW disabled flags
 * exposed on the dimension / angle badges.
 *
 * **Position is locked when ANY of:**
 *
 * 1. The corner's own `isLocked` property signal is `true` — i.e. the
 *    user explicitly locked this corner via the toolbar (a
 *    `SetNodePropertyValueCommand(pointId, 'isLocked', true)` — the
 *    preferred channel for `properties` writes; the underlying
 *    `Value<T>` can also be driven by `SetValueCommand`, but new
 *    callers should go through the property-level command so
 *    serialization stays uniform).
 * 2. **At least one** of the corner's adjacent room segments has
 *    `isLocked === true`. This is the rule called out by the task:
 *
 *    > When we lock a wall: We can consider this as locking the
 *    > position of both corner points. Those corner points should no
 *    > longer be able to move.
 *
 *    The asymmetry vs. {@link getEffectivePointAngleLocked} is intentional:
 *    one locked wall removes the corner's translational degrees of
 *    freedom — any corner move would either change that wall's length
 *    or rotate it, contradicting the lock — but leaves the **angle**
 *    between the two arms still adjustable: the user can pivot the
 *    FREE wall around the now-anchored corner without disturbing the
 *    locked one. Only when **both** adjacent walls are locked does the
 *    angle also lose its DoF, which is why
 *    `getEffectivePointAngleLocked` keeps the stricter "BOTH adjacent
 *    locked" rule.
 *
 * **Falsy paths:**
 *
 * - The id does not resolve to a `Point` — return `false`. Misrouted
 *   ids should NOT silently report "locked" from the consumer's
 *   perspective; the consumer (drag gate) will then proceed normally
 *   and the missing-node throw, if any, happens in the consumer's own
 *   `getNode` / `instanceof` chain. Returning `false` keeps this
 *   helper allocation-free and side-effect-free.
 * - The corner has zero adjacent segments (drawing in progress, or a
 *   stage with disconnected geometry). The derived rule trivially
 *   falls through; only the explicit flag matters.
 *
 * The helper is a plain `O(adjacent-segments)` read, allocation-free,
 * safe to call inside `useComputedValue` / `useSignalEffect` callbacks.
 * Callers that need the **angle**-locked state should use
 * `getEffectivePointAngleLocked` — same shape, but it requires BOTH
 * arms locked (one free arm still permits pivoting the angle) and the
 * explicit flag read is `isAngleLocked` instead of `isLocked`.
 */
const getEffectivePointPositionLocked = (core, pointId) => {
    const point = getNode(core, pointId);
    if (point.type !== NodeType.Point)
        return false;
    if (point.properties.get('isLocked')?.get() === true)
        return true;
    const adjacentSegmentIds = getRoomSegmentsByPoint(core, pointId);
    for (const segmentId of adjacentSegmentIds) {
        const segment = getNode(core, segmentId);
        if (segment.type !== NodeType.RoomSegment)
            continue;
        if (segment.properties.get('isLocked')?.get() === true)
            return true;
    }
    return false;
};

export { getEffectivePointPositionLocked };
