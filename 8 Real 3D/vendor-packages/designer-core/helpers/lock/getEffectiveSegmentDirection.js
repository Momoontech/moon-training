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
import { getEffectivePointMoveLocked } from './getEffectivePointMoveLocked.js';
import { applyDirectionLockOverride } from './types.js';

/**
 * Per-segment effective direction view used by `DimensionsUI` (and any
 * other wall-length badge consumer). Combines the global edit
 * direction (from `core.projectSettings.roomSettings.editingDirection`,
 * passed in to keep this helper pure) with the segment's own lock and
 * each endpoint's effective position-locked state.
 *
 * **Wall-length commit convention.** The length-edit callback in
 * `useSegmentLengthCallback` anchors one endpoint and translates the
 * other along the segment direction. The mapping is:
 *
 *   - `Direction.CW`  → anchor `from`, MOVE `to`
 *   - `Direction.CCW` → anchor `to`,  MOVE `from`
 *
 * So a side is disabled exactly when its moving endpoint cannot land —
 * which is now the full {@link getEffectivePointMoveLocked} predicate,
 * not just the endpoint's own position lock:
 *
 *   - `isCWDisabled` is `true` when the segment is locked (no length
 *     edit at all) OR moving the `to` endpoint is forbidden — `to`
 *     position-locked, OR `to`'s own angle locked, OR `to`'s OTHER arm
 *     (the one NOT leading to `from`) ends at an angle-locked corner.
 *   - `isCCWDisabled` is `true` when the segment is locked OR moving
 *     the `from` endpoint is forbidden — the symmetric rule with the
 *     anchor swapped to `to`.
 *
 * **The transitive arm check is the fix for the lock-bypass bug.**
 * Moving an endpoint rebuilds its other wall, rotating it and changing
 * the angle at that wall's far corner. If that far corner is
 * angle-locked, the length edit must be disabled even though the
 * endpoint itself is free to translate — otherwise the user could grow
 * the selected wall and silently break a locked angle two corners away.
 * The moved endpoint slides along THIS segment's axis, so this
 * segment's bearing (and the anchor's angle) is preserved — which is
 * why the arm leading back to the anchor is excluded from the check
 * (handled inside `getEffectivePointMoveLocked` via the anchor arg).
 *
 * Both flags being `true` means the wall-length input is read-only —
 * either the segment itself is locked, or neither endpoint may move.
 *
 * Returns the global direction as-is when the id does not resolve to a
 * `RoomSegment` (misrouted UUID, drawing-in-progress topology). Both
 * disabled flags are `false` in that case — the consumer is expected
 * to handle the missing-segment branch on its own (the badge wouldn't
 * be mounted for a non-segment id anyway).
 *
 * Allocation-free / side-effect-free — safe inside `useComputedValue`.
 * The returned object IS allocated per call; that's the price of
 * delivering a cohesive triple instead of three separate computeds.
 * Callers re-running this inside `useComputedValue` get value-equality
 * guarded results via the standard React key-by-key comparison.
 */
const getEffectiveSegmentDirection = (core, segmentId, globalDirection) => {
    const segment = getNode(core, segmentId);
    if (segment.type !== NodeType.RoomSegment) {
        return { direction: globalDirection, isCWDisabled: false, isCCWDisabled: false };
    }
    const segmentLocked = segment.properties.get('isLocked')?.get() === true;
    if (segmentLocked) {
        return { direction: globalDirection, isCWDisabled: true, isCCWDisabled: true };
    }
    const fromId = segment.from.get();
    const toId = segment.to.get();
    // CW moves `to` (anchor `from`); CCW moves `from` (anchor `to`). Each
    // side passes the OTHER endpoint as the anchor so the transitive arm
    // check skips this segment (its bearing is preserved by the slide).
    const toLocked = getEffectivePointMoveLocked(core, toId, fromId);
    const fromLocked = getEffectivePointMoveLocked(core, fromId, toId);
    return {
        direction: applyDirectionLockOverride(globalDirection, toLocked, fromLocked),
        isCWDisabled: toLocked,
        isCCWDisabled: fromLocked
    };
};

export { getEffectiveSegmentDirection };
