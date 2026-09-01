import { batch } from '@preact/signals-react';
import { generateId } from './id.js';
import { CreateNodeCommand, RemoveNodeCommand } from '../components/commands/CreateNodeCommand.js';
import SetNodeParentCommand from '../components/commands/SetNodeParentCommand.js';
import SetNodeSignalCommand from '../components/commands/SetNodeSignalCommand.js';
import SetNodeVectorComponentCommand from '../components/commands/SetNodeVectorComponentCommand.js';
import { importFromCatalog } from '../components/helpers/importFromCatalog.js';
import { Point } from '../components/Node/components/Point/index.js';
import '../components/Node/helpers/defaultHoleCurve.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import { MountType } from '../declarations/helpers.js';
import { VectorProps, V3Axes } from '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import { NodeType } from '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import { SegmentType } from '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';
import getNode from '../components/Node/helpers/getNode.js';
import './multiCloset/contentPartTypes.js';
import '../components/Node/helpers/getResizableSides.js';
import getParentRoom from '../components/Node/helpers/getParentRoom.js';
import getPoint from '../components/Node/helpers/getPoint.js';
import getRoom from '../components/Node/helpers/getRoom.js';
import getRoomSegment from '../components/Node/helpers/getRoomSegment.js';
import '../components/Node/helpers/getSelectableNode.js';
import getStage from '../components/Node/helpers/getStage.js';
import getWall2D from '../components/Node/helpers/getWall2D.js';
import { Vector2 } from './math/Vector2.js';
import './math/plane/unitBoxCorners.js';
import './math/plane/projectUnitBoxToFootprint2D.js';
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
import '../components/Node/components/PointLight/index.js';
import '../components/Node/components/RawPanel/index.js';
import './cathedral/computeCathedralContext.js';
import '../components/Node/components/ShapedBoxContainer/index.js';
import '../components/Node/components/SpotLight/index.js';
import '../components/Node/components/Tiles/index.js';
import '../components/Node/components/ToeKickPanel/index.js';
import '../components/Node/components/Valance/index.js';
import '../components/Node/components/Wall2D/index.js';
import '../components/Node/components/WindowFrame/index.js';
import '../components/commands/core/Command.js';
import './getMultiClosetJointTarget.js';
import SetSelectedNodeIdCommand from '../components/commands/SetSelectedNodeIdCommand.js';

const expandRoomSegmentWithPoint = (core, roomSegment, point, parentId) => {
    return batch(() => {
        const commands = [];
        const roomSegmentId = typeof roomSegment === 'string' ? roomSegment : roomSegment.id;
        const roomSegmentNode = getRoomSegment(core, roomSegmentId);
        const currentRoomSegment = getRoomSegment(core, roomSegmentId);
        const currentRoomSegmentJSON = currentRoomSegment.toJSON();
        const fromPoint = getPoint(core, currentRoomSegmentJSON.from);
        const toPoint = getPoint(core, currentRoomSegmentJSON.to);
        // Calculate Geometry (Mid Points)
        const dx = toPoint.position.x.get() - fromPoint.position.x.get();
        const dy = toPoint.position.y.get() - fromPoint.position.y.get();
        const length = Math.sqrt(dx * dx + dy * dy);
        // Tuple shape: `[roomSegmentId, wall2DId, mountPlaneId, pointIds]`. We
        // resolve the new wall's slots (MountPlane + MountLine) through
        // `getWall2D(newWall2DId).children` below, so the per-slot ids do not
        // need to be destructured here.
        const [newRoomSegmentId, newWall2DId, , pointIds] = createRoomSegment(core, point, roomSegmentNode.to.get(), parentId);
        commands.push(new SetNodeSignalCommand(roomSegmentId, 'to', pointIds[0]));
        // Update Room Path
        const room = getParentRoom(core, roomSegmentId);
        const currentRoomPath = room.path.get();
        const roomSegIdx = currentRoomPath.indexOf(roomSegmentId);
        const newRoomPath = [
            ...currentRoomPath.slice(0, roomSegIdx + 1),
            newRoomSegmentId,
            ...currentRoomPath.slice(roomSegIdx + 1)
        ];
        commands.push(new SetNodeSignalCommand(room.id, 'path', newRoomPath));
        const wall2D = roomSegmentNode.wall2D.get();
        if (wall2D) {
            const wall2DNode = getWall2D(core, wall2D);
            const oldSlotIds = wall2DNode.children.get();
            const newWall2DNode = getWall2D(core, newWall2DId);
            const newSlotIds = newWall2DNode.children.get();
            // Pair old slots with new slots by index — `[oldMountPlane, oldMountLine]`
            // → `[newMountPlane, newMountLine]`. Defensive on length so a future
            // Wall2D variant with fewer/more slots doesn't throw here.
            const slotCount = Math.min(oldSlotIds.length, newSlotIds.length);
            for (let i = 0; i < slotCount; i += 1) {
                const oldSlotId = oldSlotIds[i];
                const newSlotId = newSlotIds[i];
                if (!oldSlotId || !newSlotId)
                    continue;
                // `MountPlane` and `MountLine` both expose `.children` (built via the
                // `withChildren('children')` step in their `NodeBuilder` chain), so
                // we read the slot through the generic `getNode` instead of the
                // type-narrowing `getMountPlane`/`getMountLine` helpers — those
                // would throw on the opposite slot type.
                const oldSlotNode = getNode(core, oldSlotId);
                for (const childId of oldSlotNode.children.get()) {
                    const item = getNode(core, childId);
                    if (item.position.x.get() + item.size.x.get() / 2 > length / 2) {
                        commands.push(new SetNodeParentCommand(item.id, newSlotId));
                        commands.push(new SetNodeVectorComponentCommand(item.id, VectorProps.position, V3Axes.x, item.position.x.get() - length / 2));
                    }
                }
            }
        }
        ////
        core.runCommandsAsTransaction(commands);
        return pointIds[0];
    });
};
const expandRoomWithHole = (core, roomId, ccwPoints) => {
    batch(() => {
        const room = getRoom(core, roomId);
        const stageId = room.parent.get();
        const roomHoles = room.holes.get();
        const points = ccwPoints.map((point) => createPoint(core, point, stageId));
        const newHole = [];
        for (let i = 0; i < points.length; i += 1) {
            const [segementId] = createRoomSegment(core, points[i], points[i === points.length - 1 ? 0 : i + 1], stageId);
            newHole.push(segementId);
        }
        core.runCommandsAsTransaction(new SetNodeSignalCommand(room.id, 'holes', [...roomHoles, newHole]));
    });
};
const removeSegmentFromRoom = (core, segmentId, deleteSegment = true) => {
    const segment = getRoomSegment(core, segmentId);
    const fromPointId = segment.from.get();
    const toPointId = segment.to.get();
    const room = getParentRoom(core, segmentId);
    const roomPath = room.path.get();
    const prevSegementId = roomPath[roomPath.indexOf(segmentId) > 0 ? roomPath.indexOf(segmentId) - 1 : roomPath.length - 1];
    const nextSegementId = roomPath[roomPath.indexOf(segmentId) < roomPath.length - 1 ? roomPath.indexOf(segmentId) + 1 : 0];
    const commands = [];
    commands.push(new SetNodeSignalCommand(prevSegementId, 'to', fromPointId));
    commands.push(new SetNodeSignalCommand(nextSegementId, 'from', toPointId));
    commands.push(new SetNodeSignalCommand(room.id, 'path', roomPath.filter((id) => id !== segmentId)));
    if (deleteSegment) {
        commands.push(new RemoveNodeCommand(segmentId));
        commands.push(new RemoveNodeCommand(fromPointId));
        commands.push(new RemoveNodeCommand(toPointId));
    }
    core.runCommandsAsTransaction(commands);
    return room.id;
};
const createRoomSegment = (core, from, to, parentId
// optionalData: Partial<RoomSegmentConfig> = {}
) => {
    const pointIds = [];
    return batch(() => {
        const points = [from, to];
        for (let i = 0; i < points.length; i += 1) {
            const point = points[i];
            if (typeof point === 'string') {
                pointIds.push(point);
            }
            else if (point instanceof Point) {
                pointIds.push(point.id);
            }
            else {
                pointIds.push(createPoint(core, point, parentId));
            }
        }
        const roomSegmentId = generateId();
        const wall2DId = generateId();
        const mountPlaneId = generateId();
        const mountLineId = generateId();
        const defaultWall2DAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultWall2DAttributes');
        const defaultRoomSegmentAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomSegmentAttributes');
        const data = {
            [roomSegmentId]: {
                uuid: roomSegmentId,
                type: NodeType.RoomSegment,
                segmentType: SegmentType.linear,
                from: pointIds[0],
                to: pointIds[1],
                parent: parentId,
                wall2D: wall2DId,
                attributes: { ...defaultRoomSegmentAttributes }
            },
            [wall2DId]: {
                uuid: wall2DId,
                type: NodeType.Wall2D,
                parent: roomSegmentId,
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
        core.runCommandsAsTransaction(new CreateNodeCommand(data, roomSegmentId, parentId, 'segments'));
        return [roomSegmentId, wall2DId, mountPlaneId, pointIds];
    });
};
const createRoomFromSegments = (core, segments, parentId) => {
    const roomId = generateId();
    const floor2DId = generateId();
    const floorMountPlaneId = generateId();
    const ceiling2DId = generateId();
    const ceilingMountPlaneId = generateId();
    const baseboardId = generateId();
    const decoMoldingId = generateId();
    const segmentIds = segments.map((segment) => (typeof segment === 'string' ? segment : segment.id));
    const defaultRoomAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomAttributes');
    const baseboardCatalog = importFromCatalog(core, 'master/Mouldings/Handle/baseboard');
    const decoMoldingCatalog = importFromCatalog(core, 'master/Mouldings/Handle/decoMolding');
    const data = {
        [roomId]: {
            uuid: roomId,
            type: NodeType.Room,
            parent: parentId,
            path: segmentIds,
            holes: [],
            floor2D: floor2DId,
            ceiling2D: ceiling2DId,
            children: [baseboardId, decoMoldingId],
            attributes: { ...defaultRoomAttributes }
        },
        // Floor2D always owns a floor MountPlane — it is the only drop target for
        // floor-mounted Items. Same subtree shape as the RoomPlan converter,
        // `createDependentRoom`, and the v1057→v2000 migration; a Floor2D with no
        // MountPlane leaves the room unable to accept any product on its floor.
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
        }
    };
    core.runCommandsAsTransaction(new CreateNodeCommand(data, roomId, parentId, 'rooms'), 'Create room');
    console.log('createRoomFromSegments', data);
    return [roomId, floor2DId, ceiling2DId, segmentIds];
};
const createRoomFromPoints = (core, points, parentId) => {
    const roomId = generateId();
    const floor2DId = generateId();
    const floorMountPlaneId = generateId();
    const ceiling2DId = generateId();
    const ceilingMountPlaneId = generateId();
    const baseboardId = generateId();
    const decoMoldingId = generateId();
    const pointIds = [];
    const roomSegmentIds = [];
    for (let i = 0; i < points.length; i += 1) {
        const point = points[i];
        if (typeof point === 'string') {
            pointIds.push(point);
        }
        else if (point instanceof Point) {
            pointIds.push(point.id);
        }
        else {
            pointIds.push(createPoint(core, point, parentId));
        }
    }
    for (let i = 0; i < pointIds.length; i += 1) {
        const fromPointId = pointIds[i];
        const toPointId = pointIds[i === pointIds.length - 1 ? 0 : i + 1];
        const [roomSegmentId] = createRoomSegment(core, fromPointId, toPointId, parentId);
        roomSegmentIds.push(roomSegmentId);
    }
    const defaultRoomAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomAttributes');
    const baseboardCatalog = importFromCatalog(core, 'master/Mouldings/Handle/baseboard');
    const decoMoldingCatalog = importFromCatalog(core, 'master/Mouldings/Handle/decoMolding');
    const data = {
        [roomId]: {
            uuid: roomId,
            type: NodeType.Room,
            parent: parentId,
            path: roomSegmentIds,
            holes: [],
            floor2D: floor2DId,
            ceiling2D: ceiling2DId,
            children: [baseboardId, decoMoldingId],
            attributes: { ...defaultRoomAttributes }
        },
        // See `createRoomFromSegments` — Floor2D must own a floor MountPlane or
        // nothing can be dropped on the floor of the resulting room.
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
        }
    };
    core.runCommandsAsTransaction(new CreateNodeCommand(data, roomId, parentId, 'rooms'), 'Create room');
    console.log('createRoomFromPoints', data);
    return [roomId, floor2DId, ceiling2DId, roomSegmentIds];
};
const createPoint = (core, position, parentId) => {
    const uuid = generateId();
    const pointConfig = {
        [uuid]: {
            uuid,
            type: NodeType.Point,
            position: { x: position.x, y: position.y },
            parent: parentId,
            children: [],
            attributes: {}
        }
    };
    console.log('createPoint', uuid);
    core.runCommandsAsTransaction([new CreateNodeCommand(pointConfig, uuid, parentId, 'points')], 'Create point');
    return uuid;
};
const createRoomPoint = (core, pos, parentId, addToHistory = false) => {
    const pointConfig = {
        uuid: generateId(),
        type: NodeType.Point,
        position: { x: pos.x, y: pos.y },
        parent: parentId,
        children: [],
        attributes: {}
    };
    core.runCommandsAsTransaction([new CreateNodeCommand(pointConfig, pointConfig.uuid, parentId, 'points')], 'Create point', addToHistory);
};
const addRoomSegment = (core, id) => {
    const currentRoomSegment = getRoomSegment(core, id);
    const currentRoomSegmentJSON = currentRoomSegment.toJSON();
    const fromPoint = getPoint(core, currentRoomSegmentJSON.from);
    const toPoint = getPoint(core, currentRoomSegmentJSON.to);
    const stage = getStage(core, currentRoomSegmentJSON.parent);
    const midX = (fromPoint.position.x.get() + toPoint.position.x.get()) / 2;
    const midY = (fromPoint.position.y.get() + toPoint.position.y.get()) / 2;
    const tx = core.beginTransaction('Add room segment split');
    const newPointId = expandRoomSegmentWithPoint(core, id, new Vector2(midX, midY), stage.id);
    core.runCommandsAsTransaction(new SetSelectedNodeIdCommand(newPointId));
    tx.end();
};

export { addRoomSegment, createPoint, createRoomFromPoints, createRoomFromSegments, createRoomPoint, createRoomSegment, expandRoomSegmentWithPoint, expandRoomWithHole, removeSegmentFromRoom };
