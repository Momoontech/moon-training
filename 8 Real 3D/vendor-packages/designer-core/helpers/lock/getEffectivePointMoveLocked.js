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
import { getEffectivePointAngleLocked } from './getEffectivePointAngleLocked.js';
import { getEffectivePointPositionLocked } from './getEffectivePointPositionLocked.js';

/**
 * Decides whether moving a single corner (`pointId`) is forbidden by
 * the lock rules — including **transitive** angle locks one hop away.
 * This is the predicate behind the per-arrow disable flags for BOTH
 * editable inputs that move exactly one corner:
 *
 *   - Wall-length edit (`getEffectiveSegmentDirection`) — moving the
 *     segment's `to` (CW) or `from` (CCW). The OTHER endpoint of the
 *     edited segment is the `anchorPointId` (it stays put; the edited
 *     wall keeps its bearing because the moved endpoint slides along
 *     the wall's own axis).
 *   - Corner-angle edit (`getEffectivePointDirection`) — rotating one
 *     adjacent corner around the locked vertex. The vertex being
 *     edited is the `anchorPointId` (the rotation pivot).
 *
 * **Why the existing position-lock check was not enough.** The old
 * logic disabled an arrow only when the moved corner was effectively
 * position-locked. But moving a corner REBUILDS each of its arms — and
 * rebuilding an arm rotates it, which changes the angle at that arm's
 * FAR corner. If that far corner has a locked angle, the edit would
 * silently break the lock. Concretely (user report): top wall locked +
 * bottom-right corner angle-locked; selecting the LEFT wall still
 * offered a length edit in the free direction, because the moving
 * bottom-left corner was not itself position-locked — yet that move
 * rebuilds the bottom (diagonal) wall, rotating it and breaking the
 * angle lock at the bottom-right corner. The lock must look past the
 * immediate neighbour to the neighbour's neighbour.
 *
 * **Forbidden when ANY of:**
 *
 * 1. The corner is effectively position-locked
 *    ({@link getEffectivePointPositionLocked}) — it cannot move at all.
 * 2. The corner's OWN angle is effectively locked
 *    ({@link getEffectivePointAngleLocked}) — moving it changes the
 *    angle between its two arms, which is pinned. (Normally implied by
 *    #1, since the toolbar pairs the two flags; kept explicit so an
 *    angle-only lock — a future "lock angle, allow translate" mode —
 *    still blocks here.)
 * 3. Any adjacent arm whose FAR endpoint is NOT the anchor leads to a
 *    corner with a locked angle. Rebuilding that arm (the moved corner
 *    is its near endpoint) rotates it about the far corner, changing
 *    the far corner's locked angle. The arm leading back to the anchor
 *    is skipped: for a wall-length edit the moved corner slides along
 *    that arm's axis (bearing preserved → the anchor's angle is
 *    untouched); for an angle edit that arm IS the one whose bearing is
 *    meant to change, and the pivot's angle lock is handled by the
 *    caller's top-level guard.
 *
 * **One hop is sufficient.** Both edits move exactly ONE corner; every
 * other corner stays put. So only the moved corner's own angle and the
 * angles at its two immediate neighbours can change — there is no
 * deeper cascade to chase. The "neighbour's neighbour" the user asked
 * for is, from the edited wall's point of view, the far endpoint of the
 * moved corner's OTHER arm — reached by the `adjacent → far endpoint`
 * walk below.
 *
 * `O(adjacent-segments)` — allocation-free / side-effect-free, safe
 * inside `useComputedValue`. Returns `false` for a misrouted id
 * (non-Point), matching the sibling helpers' falsy-on-mismatch
 * contract.
 */
const getEffectivePointMoveLocked = (core, pointId, anchorPointId) => {
    const point = getNode(core, pointId);
    if (point.type !== NodeType.Point)
        return false;
    if (getEffectivePointPositionLocked(core, pointId))
        return true;
    if (getEffectivePointAngleLocked(core, pointId))
        return true;
    const adjacentSegmentIds = getRoomSegmentsByPoint(core, pointId);
    for (const segmentId of adjacentSegmentIds) {
        const segment = getNode(core, segmentId);
        if (segment.type !== NodeType.RoomSegment)
            continue;
        const farId = segment.from.get() === pointId ? segment.to.get() : segment.from.get();
        if (farId === anchorPointId)
            continue;
        if (getEffectivePointAngleLocked(core, farId))
            return true;
    }
    return false;
};

export { getEffectivePointMoveLocked };
