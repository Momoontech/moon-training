import CreateNodeFromCatalogCommand from '../../../components/commands/CreateNodeFromCatalogCommand.js';
import { importFromCatalog } from '../../../components/helpers/importFromCatalog.js';
import { resolveCatalogConfig } from '../../../components/helpers/resolveCatalogConfig.js';
import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import { ItemType, MountType } from '../../../declarations/helpers.js';
import '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import { SegmentType } from '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import getNode from '../../../components/Node/helpers/getNode.js';
import { getMonitor } from '../../monitor.js';
import '../../../components/Node/components/AdjustableBox/index.js';
import '../../../components/Node/components/AdjustableExtrusion/index.js';
import '../../../components/Node/components/BoxContainer/index.js';
import '../../../components/Node/components/Carcass/index.js';
import '../../../components/Node/components/Ceiling2D/index.js';
import '../../../components/Node/components/Countertop/index.js';
import '../../../components/Node/components/CrownMolding/index.js';
import '../../../components/Node/components/Edgebanding/index.js';
import '../../../components/Node/components/Floor2D/index.js';
import '../../../components/Node/components/Frame/index.js';
import '../../../components/Node/components/FreeBoxContainer/index.js';
import '../../../components/Node/components/GateFrame/index.js';
import '../../../components/Node/components/Glass/index.js';
import '../../../components/Node/components/Image/index.js';
import '../../../components/Node/components/Item/index.js';
import '../../../components/Node/components/LaminateBox/index.js';
import '../../../components/Node/components/MiteredPanel/index.js';
import '../../../components/Node/BaseModel.js';
import '../../../components/Node/components/Molding/index.js';
import '../../../components/Node/components/MountLine/index.js';
import '../../../components/Node/components/MountPlane/index.js';
import '../../../components/Node/components/MountPoint/index.js';
import '../../../components/Node/components/Panel/index.js';
import '../../../components/Node/components/Part/index.js';
import '../../../components/Node/components/Point/index.js';
import '../../../components/Node/components/PointLight/index.js';
import '../../../components/Node/components/RawPanel/index.js';
import '@preact/signals-react';
import '../../cathedral/computeCathedralContext.js';
import '../../../components/Node/components/ShapedBoxContainer/index.js';
import '../../../components/Node/components/SpotLight/index.js';
import '../../../components/Node/components/Tiles/index.js';
import '../../../components/Node/components/ToeKickPanel/index.js';
import '../../../components/Node/components/Valance/index.js';
import '../../../components/Node/components/Wall2D/index.js';
import '../../../components/Node/components/WindowFrame/index.js';
import '../../../components/Node/helpers/effects.js';
import '../../../components/Node/helpers/effects.reachInCloset.js';
import '../../../components/Node/helpers/effects.wallHole.js';
import '../../../components/Node/helpers/defaultHoleCurve.js';
import '../../multiCloset/contentPartTypes.js';
import '../../../components/Node/helpers/getResizableSides.js';
import '../../../components/Node/helpers/getSelectableNode.js';
import { Vector2 } from '../../math/Vector2.js';
import { Vector3 } from '../../math/Vector3.js';
import { Matrix4 } from '../../math/Matrix4.js';
import { isCCW } from '../../math/isCCW.js';
import '../../math/plane/unitBoxCorners.js';
import '../../math/plane/projectUnitBoxToFootprint2D.js';
import { generateId } from '../../id.js';
import { resolveCatalogPath } from './catalogMap.js';
import { meetsConfidenceThreshold, extractLocalProductPlacement, transformFloorCorner, extractWorldProductPlacement, findNearestWallMountPlane } from './coordinates.js';

// ---------------------------------------------------------------------------
// Well-known UUIDs — fixed for backward compatibility with existing mock data.
// ---------------------------------------------------------------------------
const FLOORPLAN_ID = 'C27F1B4B-1285-4F10-ACB7-CAAD3C2FEF23';
const STAGE_ID = '69AB333B-4C47-4CBE-92FA-8CACEE6F28E5';
/** 1 meter expressed in designer units (inches). */
const METERS_TO_UNITS = 100 / 2.54; // ≈ 39.3701
const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const DEFAULT_PERSPECTIVE_CAMERA = {
    name: 'perspective',
    matrix: IDENTITY_MATRIX,
    aspect: 1,
    fov: 50,
    zoom: 1,
    far: 10000,
    near: 0.1
};
const DEFAULT_ORTHO_CAMERA = {
    name: 'ortho',
    matrix: IDENTITY_MATRIX,
    left: -500,
    right: 500,
    top: 500,
    bottom: -500,
    zoom: 1,
    far: 10000,
    near: -1e4
};
const DEFAULT_CONTROLS = {
    minDistance: 50,
    maxDistance: 10000,
    target: { x: 0, y: 0, z: 0 }
};
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function createAppData(objects3D) {
    return {
        floorplan: FLOORPLAN_ID,
        objects3D,
        objectsCalc: {},
        selectedObject: null,
        selectedSystem: null,
        orthoMode: false,
        floorplanMode: true,
        floorplanModeParams: {
            currentStage: STAGE_ID,
            instruments: {
                mergeCorners: { enabled: false },
                deleteObject: { enabled: false }
            }
        },
        perspectiveCamera: DEFAULT_PERSPECTIVE_CAMERA,
        orthoCamera: DEFAULT_ORTHO_CAMERA,
        floorplanCamera: DEFAULT_ORTHO_CAMERA,
        controls: DEFAULT_CONTROLS
    };
}
// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------
/**
 * Pure function — converts Apple RoomPlan `CapturedRoom` JSON into a complete
 * `AppData` object that can be loaded directly into a new designer room via
 * `CoreDesigner.setAppDataFromJSON`.
 *
 * - Uses fixed well-known UUIDs for Floorplan and Stage nodes.
 * - Generates fresh UUIDs for all other nodes (rooms, points, segments, …).
 * - Reads `floors[0].polygonCorners` for the room boundary.
 *   If the floor is missing or has fewer than 3 corners, a warning is emitted
 *   and an AppData with an empty Stage is returned.
 */
function convertCapturedRoom(core, data, options = {}) {
    const { confidenceThreshold = 'low' } = options;
    const objects3D = {};
    const stagePointIds = [];
    const stageSegmentIds = [];
    const stageRoomIds = [];
    const floor = data.floors[0];
    if (!floor) {
        getMonitor().warn(`[RoomPlan] CapturedRoom "${data.story}-${data.version}" has no floor surfaces. ` +
            'Returning AppData with empty Stage.');
    }
    else if (!meetsConfidenceThreshold(floor.confidence, confidenceThreshold)) {
        getMonitor().warn(`[RoomPlan] Floor "${floor.identifier}" confidence is below the "${confidenceThreshold}" ` +
            'threshold. Skipping.');
    }
    else if (floor.polygonCorners.length < 3) {
        getMonitor().warn(`[RoomPlan] Floor "${floor.identifier}" has insufficient polygonCorners ` +
            `(${floor.polygonCorners.length}). Skipping — wall-topology fallback not yet implemented.`);
    }
    else {
        // -----------------------------------------------------------------------
        // 1. Transform floor corners from local plane space → world XZ (in designer units)
        // -----------------------------------------------------------------------
        const rawPoints = floor.polygonCorners.map((corner) => {
            const world = transformFloorCorner(corner, floor.transform);
            return new Vector2(world.x * METERS_TO_UNITS, world.y * METERS_TO_UNITS);
        });
        // -----------------------------------------------------------------------
        // 2. Ensure CCW winding order (designer-core rooms expect CCW)
        // -----------------------------------------------------------------------
        const corners = isCCW(rawPoints) ? rawPoints : [...rawPoints].reverse();
        const n = corners.length;
        // -----------------------------------------------------------------------
        // 3. Point configs — one per corner, all parented to Stage
        // -----------------------------------------------------------------------
        const pointIds = corners.map((corner) => {
            const pointId = generateId();
            objects3D[pointId] = {
                uuid: pointId,
                type: NodeType.Point,
                parent: STAGE_ID,
                position: { x: corner.x, y: corner.y },
                children: [],
                attributes: {}
            };
            stagePointIds.push(pointId);
            return pointId;
        });
        // -----------------------------------------------------------------------
        // 4. RoomSegment + Wall2D + MountPlane + MountLine configs
        //    One segment per consecutive corner pair, closing the loop (last → first).
        // -----------------------------------------------------------------------
        const segmentIds = [];
        const defaultWall2DAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultWall2DAttributes');
        const defaultRoomSegmentAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomSegmentAttributes');
        for (let i = 0; i < n; i++) {
            const fromId = pointIds[i];
            const toId = pointIds[(i + 1) % n];
            const segmentId = generateId();
            const wall2DId = generateId();
            const mountPlaneId = generateId();
            const mountLineId = generateId();
            objects3D[segmentId] = {
                uuid: segmentId,
                type: NodeType.RoomSegment,
                segmentType: SegmentType.linear,
                from: fromId,
                to: toId,
                parent: STAGE_ID,
                wall2D: wall2DId,
                attributes: { ...defaultRoomSegmentAttributes }
            };
            objects3D[wall2DId] = {
                uuid: wall2DId,
                type: NodeType.Wall2D,
                parent: segmentId,
                children: [mountPlaneId, mountLineId],
                attributes: { ...defaultWall2DAttributes }
            };
            console.log({
                uuid: wall2DId,
                type: NodeType.Wall2D,
                parent: segmentId,
                children: [mountPlaneId, mountLineId],
                attributes: { ...defaultWall2DAttributes }
            });
            objects3D[mountPlaneId] = {
                uuid: mountPlaneId,
                type: NodeType.MountPlane,
                parent: wall2DId,
                mountSlotTypes: [MountType.wall],
                children: [],
                attributes: {},
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            };
            objects3D[mountLineId] = {
                uuid: mountLineId,
                type: NodeType.MountLine,
                parent: wall2DId,
                mountSlotTypes: [MountType.wall],
                children: [],
                attributes: {},
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            };
            stageSegmentIds.push(segmentId);
            segmentIds.push(segmentId);
        }
        // -----------------------------------------------------------------------
        // 5. Room + Floor2D + Ceiling2D configs
        // -----------------------------------------------------------------------
        const roomId = generateId();
        const floor2DId = generateId();
        const ceiling2DId = generateId();
        const floorMountPlaneId = generateId();
        const ceilingMountPlaneId = generateId();
        const baseboardId = generateId();
        const decoMoldingId = generateId();
        const defaultRoomAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomAttributes');
        const baseboardCatalog = importFromCatalog(core, 'master/Mouldings/Handle/baseboard');
        const decoMoldingCatalog = importFromCatalog(core, 'master/Mouldings/Handle/decoMolding');
        objects3D[roomId] = {
            uuid: roomId,
            type: NodeType.Room,
            parent: STAGE_ID,
            path: segmentIds,
            holes: [],
            floor2D: floor2DId,
            ceiling2D: ceiling2DId,
            children: [baseboardId, decoMoldingId],
            attributes: { ...defaultRoomAttributes }
        };
        objects3D[baseboardId] = {
            ...baseboardCatalog,
            uuid: baseboardId,
            parent: roomId,
            children: [],
            attributes: { ...(baseboardCatalog.attributes || {}) }
        };
        objects3D[decoMoldingId] = {
            ...decoMoldingCatalog,
            uuid: decoMoldingId,
            parent: roomId,
            children: [],
            attributes: { ...(decoMoldingCatalog.attributes || {}) }
        };
        objects3D[floorMountPlaneId] = {
            uuid: floorMountPlaneId,
            type: NodeType.MountPlane,
            parent: floor2DId,
            mountSlotTypes: [MountType.floor],
            children: [],
            attributes: {},
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        };
        objects3D[floor2DId] = {
            uuid: floor2DId,
            type: NodeType.Floor2D,
            parent: roomId,
            children: [floorMountPlaneId],
            attributes: {}
        };
        objects3D[ceilingMountPlaneId] = {
            uuid: ceilingMountPlaneId,
            type: NodeType.MountPlane,
            parent: ceiling2DId,
            mountSlotTypes: [MountType.ceiling],
            children: [],
            attributes: {},
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        };
        objects3D[ceiling2DId] = {
            uuid: ceiling2DId,
            type: NodeType.Ceiling2D,
            parent: roomId,
            children: [ceilingMountPlaneId],
            attributes: {}
        };
        stageRoomIds.push(roomId);
    }
    // -------------------------------------------------------------------------
    // Stage node — always present, even when the floor was skipped
    // -------------------------------------------------------------------------
    objects3D[STAGE_ID] = {
        uuid: STAGE_ID,
        type: NodeType.Stage,
        parent: FLOORPLAN_ID,
        rooms: stageRoomIds,
        points: stagePointIds,
        segments: stageSegmentIds,
        attributes: {}
    };
    // -------------------------------------------------------------------------
    // Floorplan root node
    // -------------------------------------------------------------------------
    objects3D[FLOORPLAN_ID] = {
        uuid: FLOORPLAN_ID,
        type: NodeType.Floorplan,
        stages: [STAGE_ID]
    };
    return createAppData(objects3D);
}
// ---------------------------------------------------------------------------
// Imperative product placement — requires a live CoreDesigner instance
// ---------------------------------------------------------------------------
/**
 * Places detected RoomPlan objects as designer Items on the appropriate MountPlane.
 *
 * Must be called AFTER `core.setAppDataFromJSON(convertCapturedRoom(data))` so that
 * the floorplan graph is loaded into the designer.
 *
 * Mount-plane routing rules (in order):
 *  1. parentIdentifier === null          → floor MountPlane (free-standing default)
 *  2. parent is another RoomPlan object  → floor MountPlane (child item, e.g. sink in a cabinet)
 *  3. parent is a floor surface          → floor MountPlane
 *  4. parent is a wall surface           → nearest wall MountPlane (plane-distance lookup)
 *  5. parent is a door/window/opening    → nearest wall MountPlane (wall-adjacent)
 *  6. unknown parent                     → floor MountPlane + console.warn
 */
function applyRoomPlanProducts(core, data, options = {}) {
    const { confidenceThreshold = 'low' } = options;
    // ── Resolve floor MountPlane (STAGE → rooms[0] → floor2D → children[0]) ──
    const stage = core.nodes.get(STAGE_ID);
    if (!stage) {
        getMonitor().warn('[RoomPlan] applyRoomPlanProducts: Stage not found. Was setAppDataFromJSON called first?');
        return;
    }
    const roomId = stage['rooms']?.get()?.[0];
    if (!roomId) {
        getMonitor().warn('[RoomPlan] applyRoomPlanProducts: No rooms found in stage.');
        return;
    }
    const room = core.nodes.get(roomId);
    const floor2DId = room?.['floor2D']?.get();
    if (!floor2DId) {
        getMonitor().warn('[RoomPlan] applyRoomPlanProducts: floor2D not found on room.');
        return;
    }
    const floor2D = core.nodes.get(floor2DId);
    const floorMountPlaneId = floor2D?.['children']?.get()?.[0];
    if (!floorMountPlaneId) {
        getMonitor().warn('[RoomPlan] applyRoomPlanProducts: No MountPlane found on Floor2D.');
        return;
    }
    const objects = [...data.objects, ...data.doors, ...data.windows, ...data.openings];
    // ── Build object-type lookup sets ────────────────────────────────────────
    const objectIdSet = new Set(objects.map((o) => o.identifier));
    const floorIds = new Set(data.floors.map((s) => s.identifier));
    const wallIds = new Set(data.walls.map((s) => s.identifier));
    const wallAdjacentIds = new Set([
        ...data.doors.map((s) => s.identifier),
        ...data.windows.map((s) => s.identifier),
        ...data.openings.map((s) => s.identifier)
    ]);
    const snapTolerance = options.wallSnapTolerance ?? 2;
    // ── Place each object ─────────────────────────────────────────────────────
    for (const obj of objects) {
        if (!meetsConfidenceThreshold(obj.confidence, confidenceThreshold)) {
            getMonitor().warn(`[RoomPlan] Skipping object "${obj.identifier}" (category: ${JSON.stringify(obj.category)}): ` +
                `confidence below "${confidenceThreshold}" threshold.`);
            continue;
        }
        //offset between floor level for floors and walls and floor level for objects
        const yOffset = data.floors[0]?.transform[13] ?? 0;
        const mountPlaneId = resolveMountPlane(obj, objectIdSet, floorIds, wallIds, wallAdjacentIds, snapTolerance, floorMountPlaneId, core, yOffset);
        const catalogPath = resolveCatalogPath(obj);
        const catalogNode = resolveCatalogConfig(core, catalogPath);
        if (!catalogNode) {
            continue;
        }
        // ── size: bounding box in cm (coordinate-system-agnostic) ─────────────────
        const mountPlaneNode = getNode(core, mountPlaneId);
        const mountPlaneParent = getNode(core, mountPlaneNode.parent.get());
        const children = mountPlaneParent.type === NodeType.Wall2D ? mountPlaneParent.children.get() : [];
        const { position, size, rotation } = extractLocalProductPlacement(obj, mountPlaneNode, yOffset);
        core.runCommandsAsTransaction(new CreateNodeFromCatalogCommand(catalogNode, children.length > 1 && children.indexOf(mountPlaneId) + 1 < children.length
            ? children[children.indexOf(mountPlaneId) + 1]
            : mountPlaneId, generateId(), {
            materialsSet: core.projectSettings.materials.get('defaultMaterialsSet').get(),
            position: {
                x: position.x,
                y: position.y,
                z: [ItemType.window, ItemType.gate, ItemType.reachInCloset].includes(catalogNode.itemType)
                    ? position.z - core.projectSettings.roomSettings.wDepth.get()
                    : position.z
            },
            size: {
                x: size.x,
                y: size.y,
                z: [ItemType.window, ItemType.gate, ItemType.reachInCloset].includes(catalogNode.itemType)
                    ? core.projectSettings.roomSettings.wDepth.get()
                    : size.z
            },
            rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
        }), '', false);
    }
}
// ── Per-object mount-plane resolution ─────────────────────────────────────
const resolveMountPlane = (obj, objectIdSet, floorIds, wallIds, wallAdjacentIds, snapTolerance, floorMountPlaneId, core, yOffset) => {
    const pid = obj.parentIdentifier;
    // Rules 4 & 5: explicitly wall-parented → nearest wall (unbounded search)
    if (pid !== null && (wallIds.has(pid) || wallAdjacentIds.has(pid))) {
        const { position } = extractWorldProductPlacement(obj, yOffset);
        return findNearestWallMountPlane(core, STAGE_ID, position, undefined) ?? floorMountPlaneId;
    }
    // Rules 1, 2, 3, 6: floor is the default
    if (pid !== null && !objectIdSet.has(pid) && !floorIds.has(pid)) {
        getMonitor().warn(`[RoomPlan] Unknown parentIdentifier "${pid}" for object "${obj.identifier}", using floor.`);
    }
    let mountPlaneId = floorMountPlaneId;
    // Back-face wall snap: test the object's local -Z face center against all
    // wall planes. If the back face sits within snapTolerance of a wall the
    // object is re-routed to that wall MountPlane.
    // Computed in RoomPlan world (meters) then converted to designer world 3D.
    const rpMatrix = new Matrix4().fromArray(obj.transform);
    const halfDepthM = obj.dimensions[2] / 2; // meters
    const localZ = new Vector3().setFromMatrixColumn(rpMatrix, 2); // local Z axis in RoomPlan world
    const backFaceRP = new Vector3().setFromMatrixPosition(rpMatrix).addScaledVector(localZ, -halfDepthM); // back face center in RoomPlan world
    const backFace = {
        x: backFaceRP.x * METERS_TO_UNITS,
        y: backFaceRP.y * METERS_TO_UNITS,
        z: -backFaceRP.z * METERS_TO_UNITS // designer Z = −RoomPlan Z
    };
    const snappedWall = findNearestWallMountPlane(core, STAGE_ID, backFace, snapTolerance);
    if (snappedWall !== null)
        mountPlaneId = snappedWall;
    return mountPlaneId;
};

export { FLOORPLAN_ID, STAGE_ID, applyRoomPlanProducts, convertCapturedRoom };
