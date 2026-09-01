import getPoint from '../components/Node/helpers/getPoint.js';
import getRoomSegment from '../components/Node/helpers/getRoomSegment.js';
import SetNodeVector2Command from '../components/commands/SetNodeVector2Command.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import { VectorProps } from '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import { Direction } from '../declarations/ProjectSettings.js';
import { SegmentType } from '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import { wouldRoomWallsCrossAfterOverride, wouldWallItemsOverflowAfterOverride } from './floorplanCollision.js';
import getRoomsByPoint from './getRoomsByPoint.js';
import getRoomSegmentsByPoint from './getRoomSegmentsByPoint.js';
import { getEffectivePointPositionLocked } from './lock/getEffectivePointPositionLocked.js';
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
import '../components/Node/helpers/getResizableSides.js';
import '../components/Node/helpers/getSelectableNode.js';
import { Vector2 } from './math/Vector2.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';

/**
 * Half-width of the accepted band around a right angle, in degrees.
 *
 * A wall-length edit only offsets its neighbour wall when that neighbour
 * meets the edited wall at (near-)exactly 90°. The band exists purely to
 * absorb float noise from ortho-snapped rooms and from the `atan2` round
 * trip — it is NOT a "close enough to square" allowance. A wall the user
 * drew 1° off square is deliberately outside it and falls back to the
 * single-corner edit, because offsetting a not-quite-perpendicular
 * neighbour would rotate it and silently change two corner angles.
 */
const PERPENDICULAR_ANGLE_TOLERANCE_DEG = 0.2;
/**
 * Resolves the neighbour wall on the side the edit direction extends
 * towards: `Direction.CW` anchors `from` and moves `to`, so the neighbour
 * is the other wall meeting at `to`; `Direction.CCW` mirrors it.
 *
 * Returns `null` when there is no unambiguous neighbour — the corner
 * carries anything other than exactly two walls:
 *
 * - **one** wall — an open polyline end (still being drawn), nothing to
 *   offset;
 * - **three or more** — a T-junction or a corner shared between rooms,
 *   where "the next wall along" is not defined. Picking one arbitrarily
 *   would deform whichever room the picker happened to miss.
 *
 * `O(stage.segments)` — one linear scan via {@link getRoomSegmentsByPoint},
 * matching how every other point→segment lookup in the package works
 * (there is no adjacency index).
 */
const getNeighborSegmentByDirection = (core, segmentId, direction) => {
    const segment = getRoomSegment(core, segmentId);
    const sharedPointId = direction === Direction.CW ? segment.to.get() : segment.from.get();
    const attached = getRoomSegmentsByPoint(core, sharedPointId);
    if (attached.length !== 2)
        return null;
    const neighborId = attached[0] === segmentId ? attached[1] : attached[0];
    if (neighborId === segmentId)
        return null;
    const neighbor = getRoomSegment(core, neighborId);
    const neighborFrom = neighbor.from.get();
    const farPointId = neighborFrom === sharedPointId ? neighbor.to.get() : neighborFrom;
    return { segmentId: neighborId, sharedPointId, farPointId };
};
/** Signed angle from `u` to `n`, normalized into `[0, 360)` degrees. */
const signedAngleDeg = (ux, uy, nx, ny) => {
    const cross = ux * ny - uy * nx;
    const dot = ux * nx + uy * ny;
    const deg = Math.atan2(cross, dot) * (180 / Math.PI);
    return deg < 0 ? deg + 360 : deg;
};
const isNearAngle = (angleDeg, targetDeg, toleranceDeg) => Math.abs(angleDeg - targetDeg) <= toleranceDeg;
/**
 * THE CONDITION. `true` when the wall the edit direction extends towards
 * meets the edited wall at a right angle, so offsetting it as a rigid body
 * is the correct interpretation of the length change.
 *
 * Both walls are compared by their NATURAL (`from → to`) direction, so the
 * signed angle between them lands on **90° or 270°** depending on the room's
 * traversal winding — hence both are accepted. (Comparing outgoing-from-the-
 * corner directions instead would collapse the two into one case, but it
 * would also hide which way the room is wound, which the offset path does
 * not need and the reader would have to re-derive.)
 *
 * Returns `false` — i.e. the caller keeps today's single-corner behaviour —
 * when:
 *
 * - there is no unambiguous neighbour ({@link getNeighborSegmentByDirection});
 * - either wall is not linear (an arc/bezier has no single bearing, so
 *   "perpendicular" is undefined and translating one endpoint would change
 *   its radius / control geometry);
 * - either wall is degenerate (zero length);
 * - the angle is anything other than 90° / 270° within
 *   {@link PERPENDICULAR_ANGLE_TOLERANCE_DEG}.
 *
 * Pure and allocation-free — safe to call from a `useComputedValue`.
 */
const isNeighborSegmentPerpendicular = (core, segmentId, direction, toleranceDeg = PERPENDICULAR_ANGLE_TOLERANCE_DEG) => {
    const neighbor = getNeighborSegmentByDirection(core, segmentId, direction);
    if (!neighbor)
        return false;
    const segment = getRoomSegment(core, segmentId);
    const neighborSegment = getRoomSegment(core, neighbor.segmentId);
    if (segment.segmentType !== SegmentType.linear)
        return false;
    if (neighborSegment.segmentType !== SegmentType.linear)
        return false;
    const from = getPoint(core, segment.from.get());
    const to = getPoint(core, segment.to.get());
    const ux = to.position.x.get() - from.position.x.get();
    const uy = to.position.y.get() - from.position.y.get();
    const uLen = Math.hypot(ux, uy);
    if (uLen === 0)
        return false;
    const neighborFrom = getPoint(core, neighborSegment.from.get());
    const neighborTo = getPoint(core, neighborSegment.to.get());
    const nx = neighborTo.position.x.get() - neighborFrom.position.x.get();
    const ny = neighborTo.position.y.get() - neighborFrom.position.y.get();
    const nLen = Math.hypot(nx, ny);
    if (nLen === 0)
        return false;
    const angleDeg = signedAngleDeg(ux / uLen, uy / uLen, nx / nLen, ny / nLen);
    return isNearAngle(angleDeg, 90, toleranceDeg) || isNearAngle(angleDeg, 270, toleranceDeg);
};
// Module-level scratch for the wall-item overflow gate. The builder runs once
// per committed edit (never per frame), but the override map is the exact
// shape the shared gate expects and reusing it keeps the call site allocation
// pattern identical to `useSegmentLengthCallback`'s existing single-point one.
const _overrides = new Map();
const _sharedOverride = new Vector2();
const _farOverride = new Vector2();
/**
 * THE ACTION. Builds the commands that resize the edited wall to
 * `newLength` **and translate its perpendicular neighbour rigidly** by the
 * same vector, so the neighbour keeps both its length and its bearing and
 * the room stretches instead of skewing.
 *
 * Only call this when {@link isNeighborSegmentPerpendicular} is `true` — it
 * re-resolves the neighbour rather than taking it as a parameter so the two
 * halves stay independently callable, and returns `null` if the resolve now
 * fails.
 *
 * Two points move, in one transaction (the caller's) so the whole edit is a
 * single undo step:
 *
 * - the shared corner → `anchor + u * newLength`. Computed from the ANCHOR,
 *   bit-for-bit the same expression the single-corner path uses, so the
 *   committed wall length is identical between the two branches.
 * - the neighbour's far endpoint → offset by exactly the shared corner's
 *   displacement, so the neighbour translates rigidly (a `far + u * delta`
 *   form would drift by the last float bits and leave the neighbour a
 *   hair off its original bearing).
 *
 * Returns `null` on every refusal. `null` means **skip the whole operation**:
 * emit no commands, leave the plan untouched, and let the caller revert the
 * input to its previous value. There is no partial application and no
 * clamping to the nearest legal length — a refused edit must not silently
 * commit a number the user did not type into a box they are still looking at.
 * Refused when:
 *
 * - the neighbour can no longer be resolved, or either wall is degenerate;
 * - the neighbour's far endpoint is effectively position-locked. Note this
 *   single check also covers "the neighbour wall itself is locked" and "the
 *   wall beyond the neighbour is locked", since
 *   {@link getEffectivePointPositionLocked} promotes on ANY locked adjacent
 *   segment — and both of those walls would be moved / resized by this edit,
 *   which a lock forbids;
 * - the offset would fold the room inside-out, i.e. make a wall cross another
 *   wall of the same room ({@link wouldRoomWallsCrossAfterOverride}). This is
 *   the direction-asymmetric case: on a non-convex room, shrinking towards one
 *   end is fine while shrinking towards the other drags the neighbour straight
 *   through a wall further round the outline;
 * - shrinking would leave a wall-mounted product hanging past a wall end.
 *   Checked over every wall touching either moved point, via the same
 *   {@link wouldWallItemsOverflowAfterOverride} predicate the single-corner
 *   path and the drag-collision gates use, so all three agree on "fits".
 *
 * The caller is expected to have already gated the edited segment's own lock
 * and the shared corner's lock — those apply to both branches and belong
 * upstream of the branch.
 */
const buildPerpendicularWallOffsetCommands = (core, segmentId, newLength, direction) => {
    const neighbor = getNeighborSegmentByDirection(core, segmentId, direction);
    if (!neighbor)
        return null;
    if (getEffectivePointPositionLocked(core, neighbor.farPointId))
        return null;
    const segment = getRoomSegment(core, segmentId);
    const from = getPoint(core, segment.from.get());
    const to = getPoint(core, segment.to.get());
    const fx = from.position.x.get();
    const fy = from.position.y.get();
    const tx = to.position.x.get();
    const ty = to.position.y.get();
    const currentLength = Math.hypot(tx - fx, ty - fy);
    if (currentLength === 0)
        return null;
    const ux = (tx - fx) / currentLength;
    const uy = (ty - fy) / currentLength;
    // CW : anchor `from`, move `to`   → newShared = from + u * newLength
    // CCW: anchor `to`,   move `from` → newShared = to   - u * newLength
    const nextSharedX = direction === Direction.CW ? fx + ux * newLength : tx - ux * newLength;
    const nextSharedY = direction === Direction.CW ? fy + uy * newLength : ty - uy * newLength;
    const shared = getPoint(core, neighbor.sharedPointId);
    const dx = nextSharedX - shared.position.x.get();
    const dy = nextSharedY - shared.position.y.get();
    const far = getPoint(core, neighbor.farPointId);
    const nextFarX = far.position.x.get() + dx;
    const nextFarY = far.position.y.get() + dy;
    _sharedOverride.set(nextSharedX, nextSharedY);
    _farOverride.set(nextFarX, nextFarY);
    _overrides.clear();
    _overrides.set(neighbor.sharedPointId, _sharedOverride);
    _overrides.set(neighbor.farPointId, _farOverride);
    // Fold guard. Translating the neighbour sweeps its whole body across the
    // plan, so on a non-convex room it can end up straddling a wall further
    // round the outline — folding the room inside-out. Which side that happens
    // on is direction-dependent: shrinking towards one end can be perfectly
    // valid while shrinking towards the other is not, so this cannot be decided
    // from the shape alone and has to be tested per commit.
    //
    // Strict CROSSING, not proximity: a valid result routinely leaves two walls
    // flush or collinear (extending one another), which the `wDepth`-buffer gate
    // used by the drag paths would reject. See
    // `wouldRoomWallsCrossAfterOverride`.
    const affectedRooms = getRoomsByPoint(core, neighbor.sharedPointId);
    for (const roomId of getRoomsByPoint(core, neighbor.farPointId)) {
        if (!affectedRooms.includes(roomId))
            affectedRooms.push(roomId);
    }
    for (const roomId of affectedRooms) {
        if (wouldRoomWallsCrossAfterOverride(core, roomId, _overrides))
            return null;
    }
    // Every wall touching either moved point can change length: the edited
    // wall, and — at the far corner — whatever continues past the neighbour.
    // The neighbour itself translates rigidly, so it trivially still fits its
    // own items and the gate passes it through.
    const affectedSegments = getRoomSegmentsByPoint(core, neighbor.sharedPointId);
    for (const id of getRoomSegmentsByPoint(core, neighbor.farPointId)) {
        if (!affectedSegments.includes(id))
            affectedSegments.push(id);
    }
    if (wouldWallItemsOverflowAfterOverride(core, affectedSegments, _overrides))
        return null;
    return [
        new SetNodeVector2Command(neighbor.sharedPointId, VectorProps.position, { x: nextSharedX, y: nextSharedY }),
        new SetNodeVector2Command(neighbor.farPointId, VectorProps.position, { x: nextFarX, y: nextFarY })
    ];
};

export { PERPENDICULAR_ANGLE_TOLERANCE_DEG, buildPerpendicularWallOffsetCommands, getNeighborSegmentByDirection, isNeighborSegmentPerpendicular };
