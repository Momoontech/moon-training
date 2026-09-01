import { generateId } from '../id.js';
import { CreateNodeCommand, RemoveNodeCommand } from '../../components/commands/CreateNodeCommand.js';
import SetNodeSignalCommand from '../../components/commands/SetNodeSignalCommand.js';
import { importFromCatalog } from '../../components/helpers/importFromCatalog.js';
import getRoomSegment from '../../components/Node/helpers/getRoomSegment.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { MountType, RoomType } from '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
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

const buildRoomSubtree = (core, roomId, closetId, stageId, segmentIds) => {
    const floor2DId = generateId();
    const ceiling2DId = generateId();
    const floorMountPlaneId = generateId();
    const ceilingMountPlaneId = generateId();
    const baseboardId = generateId();
    const decoMoldingId = generateId();
    const defaultRoomAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomAttributes');
    const baseboardCatalog = importFromCatalog(core, 'master/Mouldings/Handle/baseboard');
    const decoMoldingCatalog = importFromCatalog(core, 'master/Mouldings/Handle/decoMolding');
    return {
        [roomId]: {
            uuid: roomId,
            type: NodeType.Room,
            parent: stageId,
            path: segmentIds,
            holes: [],
            floor2D: floor2DId,
            ceiling2D: ceiling2DId,
            children: [baseboardId, decoMoldingId],
            attributes: { ...defaultRoomAttributes },
            roomType: RoomType.reachInCloset,
            reachInClosetId: closetId
        },
        [baseboardId]: {
            ...baseboardCatalog,
            uuid: baseboardId,
            parent: roomId,
            children: [],
            attributes: { ...(baseboardCatalog.attributes || {}) }
        },
        [decoMoldingId]: {
            ...decoMoldingCatalog,
            uuid: decoMoldingId,
            parent: roomId,
            children: [],
            attributes: { ...(decoMoldingCatalog.attributes || {}) }
        },
        [floor2DId]: {
            uuid: floor2DId,
            type: NodeType.Floor2D,
            parent: roomId,
            children: [floorMountPlaneId],
            attributes: {}
        },
        [floorMountPlaneId]: {
            uuid: floorMountPlaneId,
            type: NodeType.MountPlane,
            parent: floor2DId,
            mountSlotTypes: [MountType.floor],
            children: [],
            attributes: {},
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        [ceiling2DId]: {
            uuid: ceiling2DId,
            type: NodeType.Ceiling2D,
            parent: roomId,
            children: [ceilingMountPlaneId],
            attributes: {}
        },
        [ceilingMountPlaneId]: {
            uuid: ceilingMountPlaneId,
            type: NodeType.MountPlane,
            parent: ceiling2DId,
            mountSlotTypes: [MountType.ceiling],
            children: [],
            attributes: {},
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    };
};
/**
 * Helpers that build / rebuild the dependent `Room` (`roomType:
 * reachInCloset`) owned by a `reachInCloset` Item. Mirrors the patterns in
 * `helpers/floorplan.ts` (point + segment + room creation) but:
 *
 * 1. dispatches every `CreateNodeCommand` through `runCommandsAsTransaction(..., '', false)`
 *    so the writes nest into whichever outer transaction is currently open
 *    (catalog-drop, drag, attribute-edit, undo) — the dependent room is
 *    bookkeeping, never its own undo step;
 * 2. tags the new `Room` with `roomType: RoomType.reachInCloset` and
 *    `reachInClosetId: <closetId>` so consumers (and serialization) can
 *    distinguish dependent rooms from user-drawn rooms.
 *
 * Per-room subtree shape (matches the RoomPlan converter and
 * `createRoomFromPoints` / `createRoomFromSegments`):
 *
 *     Room (roomType: reachInCloset, reachInClosetId)
 *       ├── Floor2D
 *       │     └── MountPlane (mountSlotTypes: [floor])
 *       ├── Ceiling2D
 *       │     └── MountPlane (mountSlotTypes: [ceiling])
 *       ├── Molding (baseboard)
 *       └── Molding (decoMolding)
 *
 *   plus one Point per shape vertex and one LinearRoomSegment per edge,
 *   each segment carrying its own Wall2D / wall MountPlane / wall MountLine
 *   subtree, all parented to the Stage.
 */
const buildPointConfig = (id, parentId, position) => ({
    uuid: id,
    type: NodeType.Point,
    position: { x: position.x, y: position.y },
    parent: parentId,
    children: [],
    attributes: {}
});
const buildSegmentSubtree = (core, segmentId, fromPointId, toPointId, stageId) => {
    const wall2DId = generateId();
    const mountPlaneId = generateId();
    const mountLineId = generateId();
    const defaultWall2DAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultWall2DAttributes');
    const defaultRoomSegmentAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomSegmentAttributes');
    return {
        [segmentId]: {
            uuid: segmentId,
            type: NodeType.RoomSegment,
            segmentType: SegmentType.linear,
            from: fromPointId,
            to: toPointId,
            parent: stageId,
            wall2D: wall2DId,
            attributes: { ...defaultRoomSegmentAttributes }
        },
        [wall2DId]: {
            uuid: wall2DId,
            type: NodeType.Wall2D,
            parent: segmentId,
            children: [mountPlaneId, mountLineId],
            attributes: { ...defaultWall2DAttributes }
        },
        [mountPlaneId]: {
            uuid: mountPlaneId,
            type: NodeType.MountPlane,
            parent: wall2DId,
            mountSlotTypes: [MountType.wall],
            children: [],
            attributes: {},
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        [mountLineId]: {
            uuid: mountLineId,
            type: NodeType.MountLine,
            parent: wall2DId,
            mountSlotTypes: [MountType.wall],
            children: [],
            attributes: {},
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    };
};
/**
 * Spawns a fresh dependent `Room` for `closetId`, parented to `stageId`,
 * whose footprint is the polygon defined by `points` (Stage-local 2D).
 *
 * All writes nest into whichever outer transaction is currently open via
 * `runCommandsAsTransaction(..., '', false)` — caller is responsible for
 * setting `closet.roomId` to the returned room id (typically inside the
 * same effect run, with another `addToHistory:false` SetNodeSignalCommand
 * so the assignment is part of the same atomic undo step).
 */
const createDependentRoomForReachInCloset = (core, stageId, closetId, points) => {
    const pointIds = [];
    const segmentIds = [];
    // 1. Create Points first — segments below reference these by UUID.
    for (let i = 0; i < points.length; i += 1) {
        const id = generateId();
        const config = buildPointConfig(id, stageId, points[i]);
        core.runCommandsAsTransaction(new CreateNodeCommand({ [id]: config }, id, stageId, 'points'), '', false);
        pointIds.push(id);
    }
    // 2. Create RoomSegments (each with its Wall2D + MountPlane + MountLine).
    for (let i = 0; i < pointIds.length; i += 1) {
        const segmentId = generateId();
        const fromPointId = pointIds[i];
        const toPointId = pointIds[i === pointIds.length - 1 ? 0 : i + 1];
        const segmentObjects = buildSegmentSubtree(core, segmentId, fromPointId, toPointId, stageId);
        core.runCommandsAsTransaction(new CreateNodeCommand(segmentObjects, segmentId, stageId, 'segments'), '', false);
        segmentIds.push(segmentId);
    }
    // 3. Create the Room (floor2D / ceiling2D / mount planes are recursively
    //    instantiated by `CreateNodeCommand` via single-/multi-child properties).
    const roomId = generateId();
    const roomObjects = buildRoomSubtree(core, roomId, closetId, stageId, segmentIds);
    core.runCommandsAsTransaction(new CreateNodeCommand(roomObjects, roomId, stageId, 'rooms'), '', false);
    return { roomId, segmentIds, pointIds };
};
/**
 * Replaces the existing Point/RoomSegment topology of a dependent room
 * with a fresh polygon defined by `points`. The Room itself (with its
 * Floor2D / Ceiling2D / mount planes) is preserved — only `room.path` and
 * the segments + points it references are swapped.
 *
 * Used when `roomShape`'s curve point COUNT changes (catalog template
 * edit). The hot path during drag uses point-position writes instead.
 *
 * Items hosted on the discarded segments' Wall2D MountPlanes are lost —
 * acceptable because reach-in closet Wall2D children are not a designed
 * surface for end users (see plan §9 "out of scope").
 */
const rebuildDependentRoomSegments = (core, room, points) => {
    const stageId = room.parent.get();
    const oldPath = room.path.get();
    // Resolve the points referenced by old segments BEFORE we start removing
    // anything — `getPoint` would throw later otherwise.
    const oldPointIds = [];
    for (let i = 0; i < oldPath.length; i += 1) {
        try {
            const seg = getRoomSegment(core, oldPath[i]);
            oldPointIds.push(seg.from.get());
        }
        catch {
            // Stale reference — skip; it'll be filtered out when removing.
        }
    }
    // 1. Build new points/segments first so the room never has a window of
    //    being topology-less mid-rebuild.
    const newPointIds = [];
    for (let i = 0; i < points.length; i += 1) {
        const id = generateId();
        const config = buildPointConfig(id, stageId, points[i]);
        core.runCommandsAsTransaction(new CreateNodeCommand({ [id]: config }, id, stageId, 'points'), '', false);
        newPointIds.push(id);
    }
    const newSegmentIds = [];
    for (let i = 0; i < newPointIds.length; i += 1) {
        const segmentId = generateId();
        const fromPointId = newPointIds[i];
        const toPointId = newPointIds[i === newPointIds.length - 1 ? 0 : i + 1];
        const segmentObjects = buildSegmentSubtree(core, segmentId, fromPointId, toPointId, stageId);
        core.runCommandsAsTransaction(new CreateNodeCommand(segmentObjects, segmentId, stageId, 'segments'), '', false);
        newSegmentIds.push(segmentId);
    }
    // 2. Atomically swap room.path and remove old segments + points.
    const cleanup = [new SetNodeSignalCommand(room.id, 'path', newSegmentIds)];
    for (let i = 0; i < oldPath.length; i += 1) {
        cleanup.push(new RemoveNodeCommand(oldPath[i]));
    }
    for (let i = 0; i < oldPointIds.length; i += 1) {
        cleanup.push(new RemoveNodeCommand(oldPointIds[i]));
    }
    core.runCommandsAsTransaction(cleanup, '', false);
};

export { createDependentRoomForReachInCloset, rebuildDependentRoomSegments };
