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
import { getEffectivePointMoveLocked } from './getEffectivePointMoveLocked.js';
import { applyDirectionLockOverride } from './types.js';

/**
 * Per-point effective direction view used by `AnglesUI` (the
 * AngleBadge consumer). Combines the global edit direction with the
 * corner's own angle-lock and each adjacent point's effective
 * position-locked state.
 *
 * **Angle-edit commit convention.** The angle-change callback in
 * `AnglesUI/handleAngleChange` rotates the MOVING adjacent point around
 * the corner while the FIXED one stays put. Which adjacent point a
 * given direction moves is decided GEOMETRICALLY — matching the badge's
 * on-screen CW/CCW arrow placement (`AnglesUI.geom`) rather than the
 * `getRoomSegmentsByPoint` array order. The rule (kept in lockstep with
 * the commit path):
 *
 *   - the CW arrow rotates `adj0` when `cross(toAdj0, toAdj1) >= 0`,
 *     else `adj1`;
 *   - the CCW arrow rotates the other one.
 *
 * So a side is disabled exactly when its moving endpoint cannot land —
 * the full {@link getEffectivePointMoveLocked} predicate, with the
 * edited vertex (`pointId`) passed as the rotation anchor:
 *
 *   - `isCWDisabled` — `true` when the corner is angle-locked
 *     (`getEffectivePointAngleLocked` — explicit flag OR both walls
 *     locked) OR moving the CW endpoint is forbidden: it is
 *     position-locked, its own angle is locked, OR its OTHER arm (not
 *     the one back to this vertex) ends at an angle-locked corner.
 *   - `isCCWDisabled` — same condition with the CCW endpoint.
 *
 * **The transitive arm check mirrors the wall-length fix.** Rotating an
 * adjacent corner about this vertex rebuilds that corner's far wall,
 * changing the angle at the wall's far corner; if that corner is
 * angle-locked the rotation must be disabled even though the rotated
 * corner is itself free. The arm leading back to this vertex is
 * excluded (it is the one whose bearing is meant to change) via the
 * anchor arg.
 *
 * Both flags being `true` means the angle is read-only — either because
 * the corner is fully angle-locked, or because neither adjacent point
 * may move.
 *
 * **Adjacency requirement.** An angle exists only when the corner has
 * exactly two adjacent room segments. For any other adjacency count
 * (1 — open polygon endpoint; 0 — disconnected; 3+ — branching, not
 * supported by AngleBadge today) both flags are `true` and the
 * direction passes through unchanged: there's nothing to commit, the
 * consumer should render the badge inert.
 *
 * Returns the global direction unchanged when the id does not resolve
 * to a `Point`.
 *
 * Allocation-free apart from the returned object; safe inside
 * `useComputedValue`.
 */
const getEffectivePointDirection = (core, pointId, globalDirection) => {
    const point = getNode(core, pointId);
    if (point.type !== NodeType.Point) {
        return { direction: globalDirection, isCWDisabled: false, isCCWDisabled: false };
    }
    const angleLocked = getEffectivePointAngleLocked(core, pointId);
    if (angleLocked) {
        return { direction: globalDirection, isCWDisabled: true, isCCWDisabled: true };
    }
    const adjacentSegmentIds = getRoomSegmentsByPoint(core, pointId);
    if (adjacentSegmentIds.length !== 2) {
        // No editable angle without exactly two arms — stay inert.
        return { direction: globalDirection, isCWDisabled: true, isCCWDisabled: true };
    }
    const seg0 = getNode(core, adjacentSegmentIds[0]);
    const seg1 = getNode(core, adjacentSegmentIds[1]);
    if (seg0.type !== NodeType.RoomSegment || seg1.type !== NodeType.RoomSegment) {
        return { direction: globalDirection, isCWDisabled: true, isCCWDisabled: true };
    }
    const adj0Id = seg0.from.get() === pointId ? seg0.to.get() : seg0.from.get();
    const adj1Id = seg1.from.get() === pointId ? seg1.to.get() : seg1.from.get();
    const adj0Node = getNode(core, adj0Id);
    const adj1Node = getNode(core, adj1Id);
    if (adj0Node.type !== NodeType.Point || adj1Node.type !== NodeType.Point) {
        return { direction: globalDirection, isCWDisabled: true, isCCWDisabled: true };
    }
    // Map CW / CCW to the moving endpoint GEOMETRICALLY — identical to the
    // badge's arrow placement (`AnglesUI.geom`) and the commit path
    // (`handleAngleChange`). Selecting by `getRoomSegmentsByPoint` ARRAY
    // ORDER (the old behaviour) only matched the visual arrows for some
    // corners; in a square room the one corner with
    // `cross(toAdj0, toAdj1) >= 0` mislabelled which arrow is disabled
    // (and which side `applyDirectionLockOverride` auto-selects) when a
    // wall was locked. Rule: the CW arrow rotates `adj0` when
    // `cross(toAdj0, toAdj1) >= 0`, else `adj1` — the convex/concave
    // layout flips in `geom` / `computeHandles` cancel out, leaving this
    // single cross-sign rule. `pointId` (the edited vertex) is the
    // rotation anchor: the moving corner's arm back to it is the one
    // whose bearing changes, so it's excluded from the transitive
    // far-corner angle-lock check inside the predicate.
    const cx = point.position.x.get();
    const cy = point.position.y.get();
    const v0x = adj0Node.position.x.get() - cx;
    const v0y = adj0Node.position.y.get() - cy;
    const v1x = adj1Node.position.x.get() - cx;
    const v1y = adj1Node.position.y.get() - cy;
    const armCross = v0x * v1y - v0y * v1x;
    const cwMovingId = armCross >= 0 ? adj0Id : adj1Id;
    const ccwMovingId = cwMovingId === adj0Id ? adj1Id : adj0Id;
    const isCWDisabled = getEffectivePointMoveLocked(core, cwMovingId, pointId);
    const isCCWDisabled = getEffectivePointMoveLocked(core, ccwMovingId, pointId);
    return {
        direction: applyDirectionLockOverride(globalDirection, isCWDisabled, isCCWDisabled),
        isCWDisabled,
        isCCWDisabled
    };
};

export { getEffectivePointDirection };
