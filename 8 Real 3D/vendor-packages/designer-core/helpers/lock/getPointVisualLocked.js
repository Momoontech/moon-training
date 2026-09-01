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

/**
 * Reads the **visual** locked state of a corner — `true` only when the
 * corner was EXPLICITLY locked by the user (its own `isLocked` AND own
 * `isAngleLocked` property signals are both set).
 *
 * **Why a separate helper from the effective-lock pair.**
 * `getEffectivePointPositionLocked` / `getEffectivePointAngleLocked`
 * fold in DERIVED locks — a corner becomes effectively position-locked
 * the moment ANY adjacent wall is locked, and effectively angle-locked
 * when BOTH walls are locked. Those derived rules are correct for
 * BEHAVIOUR (drag gates, per-arrow disable, read-only inputs), but they
 * are wrong for the corner's VISUAL treatment: locking a single wall
 * would otherwise paint both of that wall's corners as "locked" even
 * though the user never locked them — the same complaint already fixed
 * for the wall fill via `getEffectiveSegmentLocked` (own-flag only).
 *
 * The toolbar "lock corner" action writes BOTH `isLocked` and
 * `isAngleLocked` on the point inside one transaction (see the lock
 * notes in the package README). So "the user explicitly locked this
 * corner" is exactly `isLocked && isAngleLocked` on the point's own
 * flags — which is what this helper returns. A corner that is merely
 * pinned by an adjacent locked wall (position-locked but angle still
 * free) is NOT visually locked.
 *
 * Mirrors `getEffectiveSegmentLocked`'s own-flag-only philosophy for
 * the segment fill. Drives the `CornerPointState` token in
 * `RoomPointsUI/RoomPoint` (via the `usePointVisualLocked` hook). It is
 * intentionally NOT used for any drag / edit gate — those keep reading
 * the effective helpers.
 *
 * Returns `false` for a misrouted id (non-Point) — same falsy-on-
 * mismatch contract as the sibling helpers. Allocation-free /
 * side-effect-free — safe inside `useComputedValue`.
 */
const getPointVisualLocked = (core, pointId) => {
    const point = getNode(core, pointId);
    if (point.type !== NodeType.Point)
        return false;
    return (point.properties.get('isLocked')?.get() === true &&
        point.properties.get('isAngleLocked')?.get() === true);
};

export { getPointVisualLocked };
