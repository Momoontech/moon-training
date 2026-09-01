import SetNodeParentCommand from '../../components/commands/SetNodeParentCommand.js';
import SetNodeVector3Command from '../../components/commands/SetNodeVector3Command.js';
import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import getPoint from '../../components/Node/helpers/getPoint.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../declarations/helpers.js';
import { VectorProps } from '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import { NodeType } from '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import { SegmentType } from '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getMatrixWorld } from '../getMatrixWorld.js';
import { Vector3 } from '../math/Vector3.js';
import { Euler } from '../math/Euler.js';
import { Matrix4 } from '../math/Matrix4.js';
import '../math/plane/unitBoxCorners.js';
import '../math/plane/projectUnitBoxToFootprint2D.js';
import { Quaternion } from '../math/Quaternion.js';
import { getWallAttach } from './wallAttachState.js';

/**
 * Coordinate slack when matching the recorded mount-local edge back to a `RoomSegment`.
 * The two are computed from the very same `(point.x, point.y.getTransformed())` numbers,
 * so this only absorbs float round-tripping, never a real mismatch.
 */
const EDGE_MATCH_EPS = 1e-6;
/** The `multiClosetType`s that may rest on a wall `MountLine` — see the doc block below. */
const WALL_MOUNTABLE_MULTI_CLOSET_TYPES = new Set(['base', 'tall']);
// Module-level scratch — never allocated inside the call.
const _mountLineInverse = new Matrix4();
const _itemMatrix = new Matrix4();
const _localMatrix = new Matrix4();
const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _euler = new Euler();
/**
 * Resolve the recorded mount-local edge back to the `MountLine` of the `Wall2D` it belongs to.
 *
 * This is the ONLY place the edge → `RoomSegment` lookup happens, and it never runs during a
 * drag. The floor mount shape is built by `getShapeFromSegmentsAndHoles` from `room.path` in
 * order, using `(point.x, point.y.getTransformed())` — exactly the space `evaluateWallZone`
 * reports `segStart` / `segDir` in — so this is an exact coordinate match, not a search.
 *
 * `room.holes` are not scanned: `evaluateWallZone` only iterates the outer `shape.getPoints(0)`.
 * A room path containing an arc simply fails to match (an arc is subdivided into chords whose
 * starts are not segment endpoints) and the closet stays floor-parented — acceptable, since arc
 * segments carry `wall2D === null` and have no `MountLine` to attach to in the first place.
 */
const findMountLineForRecordedEdge = (core, mountPlaneId, segStartX, segStartY, segDirX, segDirY) => {
    const mountPlane = getOptionalNode(core, mountPlaneId);
    if (!mountPlane || mountPlane.type !== NodeType.MountPlane)
        return null;
    const floor2D = getOptionalNode(core, mountPlane.parent.get());
    if (!floor2D || floor2D.type !== NodeType.Floor2D)
        return null;
    const room = getOptionalNode(core, floor2D.parent.get());
    if (!room || room.type !== NodeType.Room)
        return null;
    for (const segmentId of room.path.get()) {
        const segment = getOptionalNode(core, segmentId);
        if (!segment || segment.type !== NodeType.RoomSegment)
            continue;
        if (segment.segmentType !== SegmentType.linear)
            continue;
        const wall2DId = segment.wall2D.get();
        if (!wall2DId)
            continue;
        const from = getPoint(core, segment.from.get());
        const to = getPoint(core, segment.to.get());
        const ax = from.position.x.get();
        const ay = from.position.y.getTransformed();
        if (Math.abs(ax - segStartX) > EDGE_MATCH_EPS || Math.abs(ay - segStartY) > EDGE_MATCH_EPS)
            continue;
        const dx = to.position.x.get() - ax;
        const dy = to.position.y.getTransformed() - ay;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < EDGE_MATCH_EPS)
            continue;
        if (Math.abs(dx / length - segDirX) > EDGE_MATCH_EPS || Math.abs(dy / length - segDirY) > EDGE_MATCH_EPS) {
            continue;
        }
        const wall2D = getOptionalNode(core, wall2DId);
        if (!wall2D || wall2D.type !== NodeType.Wall2D)
            return null;
        return wall2D.children.get().find((childId) => getOptionalNode(core, childId)?.type === NodeType.MountLine) ?? null;
    }
    return null;
};
/**
 * Re-parent a just-dropped multiCloset from the floor `MountPlane` onto the `MountLine` of the
 * `Wall2D` its back was snapped flush against during the drag. Returns `[]` — meaning "leave it
 * on the floor" — in every other case, including the DETACH direction: `dragOnMountPlane`
 * already re-parented the closet to the floor mid-drag, so a closet dragged away from its wall
 * needs no command at all.
 *
 * The wall is not re-derived here. It is whatever the last successful planar frame witnessed
 * (see {@link getWallAttach}), which is what keeps "attached" and "visually snapped" in
 * agreement — `resolveCollisionSnap` and `nudge` run AFTER the flush snap and can leave the
 * closet a hair off the wall, so a drop-time contact test would refuse closets the user just
 * watched snap into place.
 *
 * Why this exists: `getItemLocalXClearances` — and through it `fitItemToSizeX`, the "fit to
 * size" that runs on the first drop of a catalog closet — branches on
 * `getOptionalParentWall2D`. Only a closet in the wall's parent chain fits to the WALL's span
 * (`getWallItemClearances`) instead of to the room polygon (`getPlanarItemClearances`).
 *
 * Scope is `base` / `tall` only. `adjustPosition(MountSurface.Line)` pins `y = 0` and
 * `itemConstraints` gives `MountLine` children `WALL_HORIZONTAL` (height read-only, pinned to
 * 0), so an `upper` closet would be dropped to the floor and lose its height field. Supporting
 * it means relaxing both first.
 */
const buildMultiClosetWallMountCommands = (core, node) => {
    if (node.type !== NodeType.Item)
        return [];
    if (node.itemType.get() !== ItemType.multiCloset)
        return [];
    const multiClosetType = node.multiClosetType?.get();
    if (!multiClosetType || !WALL_MOUNTABLE_MULTI_CLOSET_TYPES.has(multiClosetType))
        return [];
    const attach = getWallAttach();
    if (!attach || attach.nodeId !== node.id)
        return [];
    // The item must still be on the plane the edge is expressed in. It will not be when a later
    // frame moved it onto some other surface, or when the drop already committed the re-parent.
    if (node.parent.get() !== attach.mountPlaneId)
        return [];
    const mountLineId = findMountLineForRecordedEdge(core, attach.mountPlaneId, attach.segStartX, attach.segStartY, attach.segDirX, attach.segDirY);
    if (!mountLineId)
        return [];
    const mountLine = getOptionalNode(core, mountLineId);
    if (!mountLine)
        return [];
    // World-preserving conversion into the mount-line frame. This is arithmetic, not a check:
    // `SetNodeParentCommand` does not touch `position`, and the floor-plane and mount-line frames
    // differ, so re-parenting without it would teleport the closet. Written verbatim — no
    // quantising of `position.z` to 0 and no forcing rotation to `(0,0,0)`. The wall zone already
    // produces those to float precision, and leaving them alone guarantees no visual jump and
    // cannot undo a collision fix `nudge` just applied. `fitItemToSizeX` reads only wall-local X.
    _mountLineInverse.copy(getMatrixWorld(mountLine, false)).invert();
    _itemMatrix.copy(getMatrixWorld(node, false));
    _localMatrix.multiplyMatrices(_mountLineInverse, _itemMatrix);
    _localMatrix.decompose(_position, _quaternion, _scale);
    _euler.setFromQuaternion(_quaternion);
    return [
        new SetNodeParentCommand(node.id, mountLineId, 'children'),
        new SetNodeVector3Command(node.id, VectorProps.position, { x: _position.x, y: _position.y, z: _position.z }),
        new SetNodeVector3Command(node.id, VectorProps.rotation, { x: _euler.x, y: _euler.y, z: _euler.z })
    ];
};

export { buildMultiClosetWallMountCommands };
