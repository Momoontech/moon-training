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

/**
 * Builds the lock-aware drag constraints for `pointId` — one entry
 * per adjacent corner whose **angle is effectively locked**
 * ({@link getEffectivePointAngleLocked}).
 *
 * **Why angle-locked neighbours produce ray constraints.** A corner
 * with `isAngleLocked === true` (or sandwiched between two locked
 * walls — see `getEffectivePointAngleLocked`) holds the bearing of
 * each of its two arms fixed. The dragged point sits at the far end
 * of one such arm; if it moves off the bearing line, the angle at the
 * locked corner would change. Spec rule:
 *
 *   > When we lock a corner angle: ... Each wall can still change in
 *   > width, but it must change in the opposite direction of the
 *   > locked corner.
 *
 * Each entry pins the dragged point to the bearing line:
 *
 *   ```
 *   candidate = pivot + t * unitDir   (t > 0)
 *   ```
 *
 * Snapshot taken from CURRENT (drag-start) positions: pivot is the
 * locked corner's position, unitDir is the unit vector from pivot to
 * the dragged point's start position. Both are captured once at
 * `onStart` and reused for the duration of the drag — drag-time
 * mutations of the dragged point's position do not feed back into the
 * unit direction (which would let the user slowly rotate the arm by
 * cumulative drift).
 *
 * **Cardinality semantics for the consumer:**
 *
 *   - 0 constraints → free drag (no angle-locked neighbours).
 *   - 1 constraint  → 1-DoF drag along the ray; the consumer projects
 *     the cursor candidate onto it via {@link applyPointDragConstraint}.
 *   - 2+ constraints → drag is **impossible**. Two non-parallel rays
 *     intersect at a single point (the start position); two parallel
 *     non-coincident rays have no common point. Either way the point
 *     is effectively position-locked for the duration of the drag.
 *     The consumer (`RoomPoint.onStart`) bails the drag in that case.
 *
 * Constraints with a degenerate distance (`pivot === dragged point`
 * — should never happen for a well-formed scene) are skipped to keep
 * the unit direction well-defined.
 *
 * Allocation: returns a fresh array of plain objects. Called once per
 * drag (in `onStart`), never inside the per-frame `onMove` hot path.
 */
const getPointDragConstraints = (core, pointId) => {
    const point = getNode(core, pointId);
    if (point.type !== NodeType.Point)
        return [];
    const px = point.position.x.get();
    const py = point.position.y.get();
    const adjacentSegmentIds = getRoomSegmentsByPoint(core, pointId);
    const constraints = [];
    for (const segmentId of adjacentSegmentIds) {
        const segment = getNode(core, segmentId);
        if (segment.type !== NodeType.RoomSegment)
            continue;
        const otherId = segment.from.get() === pointId ? segment.to.get() : segment.from.get();
        if (!getEffectivePointAngleLocked(core, otherId))
            continue;
        const otherPt = getNode(core, otherId);
        if (otherPt.type !== NodeType.Point)
            continue;
        const ox = otherPt.position.x.get();
        const oy = otherPt.position.y.get();
        const dx = px - ox;
        const dy = py - oy;
        const len = Math.hypot(dx, dy);
        if (len === 0)
            continue;
        constraints.push({
            pivotX: ox,
            pivotY: oy,
            unitDirX: dx / len,
            unitDirY: dy / len
        });
    }
    return constraints;
};

export { getPointDragConstraints };
