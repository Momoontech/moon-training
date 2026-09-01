import { NodeType, importSourceFromCatalog, Vector2, importFromCatalog, getMonitor, generateId, ItemType, MountType, Direction, getDefaultSurfaceSettings, MultiClosetsJointType, SegmentType, convertOptionalSettings } from '@moon/designer-core';

// --- ProjectSettings conversion (API → internal plain format) ---
/**
 * Converts legacy (pre-2000) projectSettings into the v2000+ plain shape.
 * Responsibilities:
 *   1. Strip the `label` field from all `{label, value}` wrappers so
 *      downstream code receives plain values — no label extraction needed at runtime.
 *   2. Inject v2000+ defaults for fields that didn't exist in the legacy API
 *      shape (`snap`, `surfaceSettings`). v2000+ data is assumed to always
 *      carry these; these defaults are the only place they get produced
 *      from scratch.
 */
const convertProjectSettings = (ps) => {
    const converted = ps;
    // snapSensitivity: IAnyUnitsShape → inches
    converted.snapSensitivity = ps.snapSensitivity.value;
    const rs = ps.roomSettings;
    // roomSettings scalar fields that arrive as IAnyUnitsShape
    converted.roomSettings = {
        ...rs,
        wHeight: rs.wHeight.value,
        wDepth: rs.wDepth.value,
        // printMode: strip labels from IAnyNumbers / IStringAttr fields
        printMode: {
            cabinetNamesOnElevation: rs.printMode.cabinetNamesOnElevation.value,
            cabinetNamesOnFloor: rs.printMode.cabinetNamesOnFloor.value,
            paperSizeRatio: rs.printMode.paperSizeRatio.value
        },
        // roomTemplate: IRoomTemplate → just the value string
        roomTemplate: rs.roomTemplate.value,
        // snap: injected during conversion — not present in legacy API data
        snap: {
            corner: {
                ortho: true
            }
        },
        // editingDirection: injected during conversion — not present in legacy
        // API data. CW matches the spec default for every consumer.
        editingDirection: Direction.CW,
        // surfaceSettings: injected during conversion — v2000+ always has them
        surfaceSettings: getDefaultSurfaceSettings()
    };
    // projectAttributes: for each entry that is {label, value}, keep only value
    const rawAttrs = ps.projectAttributes;
    const strippedAttrs = {};
    for (const key of Object.keys(rawAttrs)) {
        const raw = rawAttrs[key];
        strippedAttrs[key] = raw !== null && typeof raw === 'object' && 'value' in raw ? raw.value : raw;
    }
    // Backfill v2000+ project attributes absent from legacy data so migrated
    // projects stay consistent with the current schema.
    if (strippedAttrs.MultiClosetsJointType === undefined) {
        strippedAttrs.MultiClosetsJointType = MultiClosetsJointType.bridge;
    }
    converted.projectAttributes = strippedAttrs;
    return converted;
};
// --- Conversion Logic ---
// `buildFloorplanCameraDefaults` (top-down floorplan camera + controls from room
// bounds) now lives in `@moon/designer-core` (`helpers/converter/defaultFloorplan`)
// so it is shared with the new-project default builder; imported at the top.
// Helper to extract position from old corner node
const getVestaCornerPosition = (data, id) => {
    const node = data.objects3D[id];
    //@ts-ignore - assuming Vesta structure has position on Corner
    return new Vector2(node.position.x, node.position.y);
};
/**
 * Derive a top-down floorplan camera + orbit controls from the room's corner
 * points, so the 2-D floorplan view starts framed on the room without relying
 * on scene bounding-box init.
 *
 * Ported verbatim from the legacy 1057→2000 converter — it is a pure geometry
 * helper (no core dependency) and is now the single source of truth shared by
 * this default-project builder and `@moon/vesta-converter`'s migration.
 *
 * Matrix layout: column-major Matrix4
 *   col1 (camera right) = world +X
 *   col2 (camera up)    ≈ world −Z
 *   col3 (camera back)  ≈ world +Y  → camera looks in −Y
 *   col4 (position)     = (cx, H, cz)
 */
const buildFloorplanCameraDefaults = (points) => {
    let cx = 0;
    let cz = 0;
    if (points.length > 0) {
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y); // 2-D y axis maps to world Z
        cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        cz = (Math.min(...ys) + Math.max(...ys)) / 2;
    }
    // Camera height above floor — generous default, zoom handles fitting.
    const H = 500;
    const matrix = [1, 0, 0, 0, 0, 1e-6, -1, 0, 0, 1, 1e-6, 0, cx, H, cz, 1];
    return {
        floorplanCamera: {
            name: '',
            matrix,
            left: -756,
            right: 756,
            top: 399.5,
            bottom: -399.5,
            near: 1,
            far: 1000,
            zoom: 1.939
        },
        controls: {
            minDistance: 10,
            maxDistance: 500,
            target: { x: cx, y: 0, z: cz }
        }
    };
};
const convertAppData = (core, { appData: data, projectSettings }) => {
    // Guard: Wall3D nodes only exist in the old Vesta (pre-2000) format.
    // If there are no Wall3D nodes the data is already in v2000 format —
    // return early so this converter never runs twice on the same area.
    const hasVestaWalls = Object.values(data.objects3D ?? {}).some((n) => n.type === 'Wall3D');
    if (!hasVestaWalls) {
        // For v2000 data we still compute correct camera defaults from the Point nodes
        // so that stale or missing camera values from the backend are fixed.
        const pointPositions = Object.values(data.objects3D ?? {})
            .filter((n) => n.type === NodeType.Point)
            .map((n) => ({ x: n.position.x, y: n.position.y }));
        const { floorplanCamera, controls } = buildFloorplanCameraDefaults(pointPositions);
        return { ...data, floorplanCamera, controls };
    }
    const stages = data.objects3D[data.floorplan].stages;
    // for (let i = 0; i < stages.length; i += 1) {
    //   (data.objects3D[stages[i]] as StageVestaConfig).parent = data.floorplan;
    // }
    const values = Object.values(data.objects3D);
    for (let i = 0; i < values.length; i += 1) {
        if ('attributes' in values[i] && 'source' in values[i].attributes) {
            // During a version migration only string catalog `source` paths are
            // resolved (storage-only); the formula branch of importSourceFromCatalog
            // (which needs a live core) is never reached here, so the storage-only
            // context is safe to pass through.
            values[i].attributes = importSourceFromCatalog(core, values[i].attributes, {});
        }
    }
    // TODO: Convert DOORS from Vesta to identify doors type
    const newObjects = {};
    Object.values(data.objects3D).forEach((obj) => {
        // Preserve non-converted objects (Stages, etc)
        if (obj.type !== 'Wall3D' && obj.type !== 'Room' && obj.type !== 'Corner') {
            newObjects[obj.uuid] = obj;
        }
        if (obj.type === 'Stage') {
            newObjects[obj.uuid] = JSON.parse(JSON.stringify(obj));
            Reflect.deleteProperty(newObjects[obj.uuid], 'walls3D');
            Reflect.deleteProperty(newObjects[obj.uuid], 'corners');
            newObjects[obj.uuid].points = [];
            newObjects[obj.uuid].segments = [];
        }
        //convert items position dependent on parent to point to exact item origin
        if (obj.type === 'Item') {
            const itemConfig = newObjects[obj.uuid];
            switch (itemConfig.mountType) {
                case 'wall':
                    itemConfig.position.x -= itemConfig.size.x / 2;
                    itemConfig.position.y -= itemConfig.size.y / 2;
                    break;
                case 'floor':
                case 'countertop':
                    const size = new Vector2(itemConfig.size.x, itemConfig.size.z);
                    const rotation = itemConfig.rotation.y;
                    const rotatedSize = size.rotateAround(undefined, -rotation);
                    itemConfig.position.x -= rotatedSize.x / 2;
                    itemConfig.position.y += rotatedSize.y / 2;
                    break;
                case 'ceiling':
                    // (itemConfig.position.x as number) -= (itemConfig.size.x as number) / 2;
                    itemConfig.position.z += itemConfig.size.y;
                    break;
            }
        }
    });
    // for (let i = 0; i < stages.length; i += 1) {
    //   if (data.objects3D[stages[i]].type === NodeType.Stage) {
    //     newObjects[stages[i]] = data.objects3D[stages[i]] as unknown as StageConfig;
    //     console.log('stage', stages[i], JSON.parse(JSON.stringify(newObjects[stages[i]])));
    //   }
    // }
    // const pointMap = new Map<string, UUID>(); // Key: "x_y", Value: PointUUID
    // 1. Helper to create or reuse a Point
    const getOrCreatePoint = (p, parentId) => {
        // const key = `${p.x.toFixed(4)}_${p.y.toFixed(4)}`;
        // In strict geometry generation, we might want distinct points for different parents
        // to avoid complex dependency, but sharing points is cleaner for topology.
        // For this converter, we'll create unique points for each usage to be safe with parent-child structure,
        // or we create them as children of the Floorplan/Stage if they are shared.
        // Based on the new structure, Points are children of WallSegments or RoomSegments?
        // Actually PointConfig says parent is WallSegment/RoomSegment.
        // This implies points are NOT shared objects in the tree, but distinct children.
        const closestPoint = newObjects[parentId].points.filter((pointId) => {
            const point = newObjects[pointId];
            // if (pointType === PointType.wallPoint || point.pointType === PointType.wallPoint) return false;
            const pointPos = new Vector2(point.position.x, point.position.y);
            return pointPos.distanceTo(p) < 1e-3;
        })[0];
        if (closestPoint)
            return closestPoint;
        const pointId = generateId();
        const newPoint = {
            uuid: pointId,
            type: NodeType.Point,
            // pointType,
            parent: parentId,
            children: [],
            position: { x: p.x, y: p.y },
            attributes: {}
        };
        newObjects[pointId] = newPoint;
        newObjects[parentId].points.push(pointId);
        return pointId;
    };
    // const getOrCreateWallSegment = (from: UUID, to: UUID, parentId: UUID): UUID => {
    //   const segmentId = generateId();
    //   const newSegment: LinearWallSegmentConfig = {
    //     uuid: segmentId,
    //     segmentType: SegmentType.linear,
    //     type: NodeType.WallSegment,
    //     parent: parentId,
    //     from: from,
    //     to: to,
    //     attributes: {}
    //   };
    //   newObjects[segmentId] = newSegment;
    //   (newObjects[parentId] as StageConfig).segments.push(segmentId);
    //   return segmentId;
    // };
    const defaultRoomSegmentAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomSegmentAttributes');
    const getOrCreateRoomSegment = (from, to, parentId, wallId) => {
        const segmentId = generateId();
        const newSegment = {
            uuid: segmentId,
            segmentType: SegmentType.linear,
            type: NodeType.RoomSegment,
            parent: parentId,
            from: from,
            to: to,
            wall2D: wallId,
            attributes: { ...defaultRoomSegmentAttributes }
        };
        newObjects[segmentId] = newSegment;
        newObjects[parentId].segments.push(segmentId);
        return segmentId;
    };
    // 2. Analyze Corners and Walls
    // We need to calculate the 4 corners of every wall.
    // We process by Corner to handle intersections.
    const walls = Object.values(data.objects3D).filter((n) => n.type === 'Wall3D');
    const corners = Object.values(data.objects3D).filter((n) => n.type === 'Corner');
    // Map: CornerID -> List of connected Walls info
    const cornerData = new Map();
    corners.forEach((c) => {
        cornerData.set(c.uuid, []);
    });
    // Populate connection data
    walls.forEach((w) => {
        const start = w.from;
        const end = w.to;
        const thickness = w.attributes?.thickness ?? projectSettings.roomSettings.wDepth.value; // Default thickness if missing (e.g. 4 inches)
        const p1 = getVestaCornerPosition(data, start);
        const p2 = getVestaCornerPosition(data, end);
        const vec = p2.clone().sub(p1);
        const dir = vec.clone().normalize();
        // Wall at Start Corner (Direction is P1 -> P2)
        cornerData.get(start)?.push({
            wallId: w.uuid,
            thickness: Number(thickness),
            dir: dir,
            angle: Math.atan2(dir.y, dir.x),
            otherCornerId: end
        });
        // Wall at End Corner (Direction is P2 -> P1)
        cornerData.get(end)?.push({
            wallId: w.uuid,
            thickness: Number(thickness),
            dir: dir.clone().multiplyScalar(-1),
            angle: Math.atan2(-dir.y, -dir.x),
            otherCornerId: start
        });
    });
    // 3. Calculate Vertex Offsets
    // Store results: WallID -> CornerID -> { left: Vector2, right: Vector2 }
    // "Left" and "Right" are relative to the wall vector pointing AWAY from the corner.
    const wallVertices = new Map();
    walls.forEach((w) => wallVertices.set(w.uuid, new Map()));
    cornerData.forEach((conns, cornerId) => {
        if (conns.length === 0)
            return;
        // Sort walls angularly
        conns.sort((a, b) => a.angle - b.angle);
        const center = getVestaCornerPosition(data, cornerId);
        // Calculate intersections between adjacent walls in the sorted list
        for (let i = 0; i < conns.length; i++) {
            const curr = conns[i];
            const next = conns[(i + 1) % conns.length]; // Wrap around
            // Logic:
            // Current wall's "Left" side interacts with Next wall's "Right" side.
            // Offset vectors (relative to direction away from corner)
            const currNormal = curr.dir.clone().rotateAround(undefined, Math.PI / 2); // Normal pointing Left (90° CCW)
            const nextNormal = next.dir.clone().rotateAround(undefined, Math.PI / 2); // Normal pointing Left (90° CCW)
            const currHalfThick = curr.thickness / 2;
            const nextHalfThick = next.thickness / 2;
            // Define edge lines
            // Curr Left Edge: Center + Normal * T
            const currLeftOrigin = center.clone().addScaledVector(currNormal, currHalfThick);
            // Next Right Edge: Center - Normal * T (since Normal points Left, -Normal is Right)
            const nextRightOrigin = center.clone().addScaledVector(nextNormal, -nextHalfThick);
            // Intersect: Line intersection P + t*R = Q + u*S
            let intersection = null;
            const cross = curr.dir.cross(next.dir);
            if (Math.abs(cross) >= 1e-5) {
                // Not parallel
                const qMinusP = nextRightOrigin.clone().sub(currLeftOrigin);
                const t = qMinusP.cross(next.dir) / cross;
                intersection = currLeftOrigin.clone().addScaledVector(curr.dir, t);
            }
            // Handle parallel/collinear case (e.g. single wall ending, or collinear walls)
            // If no intersection or angle is too sharp/flat, clamp to simple offset
            const angleDiff = Math.abs(curr.angle - next.angle);
            if (!intersection || Math.abs(Math.PI - angleDiff) < 0.01) {
                // Fallback for unconnected sides or 180 connections: just use the offset point perpendicular to corner
                // This logic simplifies end-caps.
                // Actually, if conns.length == 1 (Dead end), we construct a flat cap.
                // Store for Curr (Left)
                if (!wallVertices.get(curr.wallId).has(cornerId))
                    wallVertices.get(curr.wallId).set(cornerId, {});
                wallVertices.get(curr.wallId).get(cornerId).left = currLeftOrigin;
                // Store for Next (Right)
                if (!wallVertices.get(next.wallId).has(cornerId))
                    wallVertices.get(next.wallId).set(cornerId, {});
                wallVertices.get(next.wallId).get(cornerId).right = nextRightOrigin;
            }
            // If this corner has only 1 wall, it's a dead end.
            if (conns.length === 1) {
                const w = conns[0];
                const normal = w.dir.clone().rotateAround(undefined, Math.PI / 2); // 90° CCW
                const left = center.clone().addScaledVector(normal, w.thickness / 2);
                const right = center.clone().addScaledVector(normal, -w.thickness / 2);
                wallVertices.get(w.wallId).set(cornerId, { left, right });
                continue;
            }
            // For > 1 walls, we assign the intersection point.
            // The intersection point becomes the "Left" vertex of Curr and "Right" vertex of Next.
            // Note: This assumes walls are mitered or joined perfectly.
            // We need to verify if the intersection is valid for the geometry (not infinite).
            if (intersection) {
                // Store for Curr (Left)
                if (!wallVertices.get(curr.wallId).has(cornerId))
                    wallVertices.get(curr.wallId).set(cornerId, {});
                wallVertices.get(curr.wallId).get(cornerId).left = intersection;
                // Store for Next (Right)
                if (!wallVertices.get(next.wallId).has(cornerId))
                    wallVertices.get(next.wallId).set(cornerId, {});
                wallVertices.get(next.wallId).get(cornerId).right = intersection;
            }
        }
    });
    // 4. Generate new Objects
    // -- WALLS --
    // walls.forEach((oldWall) => {
    //   const wId = oldWall.uuid;
    //   const wParent = oldWall.parent;
    //   const fromId = oldWall.from;
    //   const toId = oldWall.to;
    //   // const fromVerts = wallVertices.get(wId)?.get(fromId);
    //   // const toVerts = wallVertices.get(wId)?.get(toId);
    //   // if (fromVerts && toVerts) {
    //   //   // Create new Wall3D container
    //   //   // const newWallId = wId; // Keep ID
    //   //   // We need 4 segments forming a loop:
    //   //   // 1. From_Right -> To_Right (Main body)
    //   //   // 2. To_Right -> To_Left (Cap)
    //   //   // 3. To_Left -> From_Left (Main body return)
    //   //   // 4. From_Left -> From_Right (Cap)
    //   //   // Create Points (parented to segment)
    //   //   // const pFromRight = getOrCreatePoint(fromVerts.right, wParent, PointType.wallPoint);
    //   //   // const pToRight = getOrCreatePoint(toVerts.right, wParent, PointType.wallPoint);
    //   //   // const pFromLeft = getOrCreatePoint(fromVerts.left, wParent, PointType.wallPoint);
    //   //   // const pToLeft = getOrCreatePoint(toVerts.left, wParent, PointType.wallPoint);
    //   //   // Shared? logic says parent is segment.
    //   //   // If new structure requires strict tree, we duplicate points or reference them.
    //   //   // Assuming PointConfig parent is the Segment, we create unique points per segment leg.
    //   //   // const pToRight_2 = getOrCreatePoint(toVerts.right, wParent);
    //   //   // const pToLeft_2 = getOrCreatePoint(toVerts.left, wParent);
    //   //   // const pToLeft_3 = getOrCreatePoint(toVerts.left, wParent);
    //   //   // const pFromLeft_3 = getOrCreatePoint(fromVerts.left, wParent);
    //   //   // const pFromLeft_4 = getOrCreatePoint(fromVerts.left, wParent);
    //   //   // const pFromRight_4 = getOrCreatePoint(fromVerts.right, wParent);
    //   //   // Create Segments
    //   //   // const seg1 = getOrCreateWallSegment(pFromRight, pToRight, wParent);
    //   //   // const seg2 = getOrCreateWallSegment(pToRight_2, pToLeft_2, wParent);
    //   //   // const seg3 = getOrCreateWallSegment(pToLeft_3, pFromLeft_3, wParent);
    //   //   // const seg4 = getOrCreateWallSegment(pFromLeft_4, pFromRight_4, wParent);
    //   //   // const seg1 = getOrCreateWallSegment(pFromRight, pToLeft, wParent);
    //   //   // const seg2 = getOrCreateWallSegment(pToLeft, pToRight, wParent);
    //   //   // const seg3 = getOrCreateWallSegment(pToRight, pFromLeft, wParent);
    //   //   // const seg4 = getOrCreateWallSegment(pFromLeft, pFromRight, wParent);
    //   //   // Create New Wall3D
    //   //   // const newWall: Wall3DConfig = {
    //   //   //   uuid: newWallId,
    //   //   //   type: NodeType.Wall3D,
    //   //   //   parent: oldWall.parent, // Stage
    //   //   //   attributes: oldWall.attributes || {},
    //   //   //   path: [seg1, seg2, seg3, seg4],
    //   //   //   holes: [] // Migrate holes if needed
    //   //   // };
    //   //   // newObjects[newWallId] = newWall;
    //   // }
    // });
    // -- ROOMS --
    // Assume Room connects corners C1 -> C2 -> C3...
    // We need to find the specific "Inner" points corresponding to these corners for the specific walls.
    const rooms = Object.values(data.objects3D).filter((n) => n.type === 'Room');
    const defaultWall2DAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultWall2DAttributes');
    const defaultRoomAttributes = importFromCatalog(core, 'master/Product Attributes/General/defaultRoomAttributes');
    rooms.forEach((oldRoom) => {
        const rParent = oldRoom.parent;
        // Old room has 'corners' array
        const roomCorners = oldRoom.corners;
        if (!roomCorners || roomCorners.length < 3)
            return;
        const roomSegments = [];
        for (let i = 0; i < roomCorners.length; i++) {
            const cCurr = roomCorners[i];
            const cNext = roomCorners[(i + 1) % roomCorners.length];
            // Find the wall connecting cCurr and cNext
            // In Vesta data, Wall3D connects 'from' and 'to'.
            const wall = walls.find((w) => (w.from === cCurr && w.to === cNext) || (w.from === cNext && w.to === cCurr));
            if (wall) {
                // Determine which side of the wall is "inside" the room.
                // Assuming counter-clockwise room winding, the "Left" side of the vector (Curr->Next) is inside.
                // If Wall is From->To (matches Curr->Next), we need Wall's Left.
                // If Wall is To->From (opposes Curr->Next), we need Wall's Right (which is Left relative to traverse direction).
                let pStart, pEnd;
                const vertsStart = wallVertices.get(wall.uuid)?.get(cCurr);
                const vertsEnd = wallVertices.get(wall.uuid)?.get(cNext);
                if (!vertsStart || !vertsEnd)
                    continue;
                // Wall direction matches room traverse
                pStart = vertsStart.left;
                pEnd = vertsEnd.right;
                // } else {
                // Wall direction opposes room traverse
                // pStart = vertsStart.left;
                // pEnd = vertsEnd.right;
                // }
                // Create Segment
                const p1Id = getOrCreatePoint(pStart, rParent);
                const p2Id = getOrCreatePoint(pEnd, rParent);
                let wall2DId = '';
                if (wall.wall2D_1 && oldRoom.walls2D.includes(wall.wall2D_1))
                    wall2DId = wall.wall2D_1;
                if (wall.wall2D_2 && oldRoom.walls2D.includes(wall.wall2D_2))
                    wall2DId = wall.wall2D_2;
                const segId = getOrCreateRoomSegment(p1Id, p2Id, rParent, wall2DId);
                if (!wall2DId) {
                    getMonitor().warn('Not able to find wall2D for room segment', oldRoom.uuid, wall.uuid);
                }
                else {
                    //insert a mount plane for each Wall2D for consistency
                    const wall2D = newObjects[wall2DId];
                    if (wall2D) {
                        const uuid = generateId();
                        const mountLineUuid = generateId();
                        const mountPlaneChildren = [];
                        const mountLineChildren = [];
                        wall2D.children.forEach((child) => {
                            const childObject = newObjects[child];
                            if (childObject) {
                                if (childObject.type === NodeType.Item &&
                                    [ItemType.window, ItemType.gate].includes(childObject.itemType)) {
                                    childObject.parent = mountLineUuid;
                                    mountLineChildren.push(childObject.uuid);
                                }
                                else {
                                    childObject.parent = uuid;
                                    mountPlaneChildren.push(childObject.uuid);
                                }
                            }
                        });
                        const wallMountPlane = {
                            uuid,
                            type: NodeType.MountPlane,
                            mountSlotTypes: [MountType.wall],
                            parent: wall2DId,
                            attributes: {},
                            children: mountPlaneChildren,
                            position: { x: 0, y: 0, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 }
                        };
                        newObjects[uuid] = wallMountPlane;
                        const wall2DNode = newObjects[wall2DId];
                        wall2DNode.children = [uuid, mountLineUuid];
                        wall2DNode.parent = segId;
                        // Backfill required attributes — legacy Wall2D objects had none;
                        // legacy values (if present) take precedence over defaults.
                        wall2DNode.attributes = {
                            ...defaultWall2DAttributes,
                            ...(wall2DNode.attributes || {})
                        };
                        // Add a MountLine at floor level along the base of each Wall2D.
                        // Its geometry is derived from the parent RoomSegment endpoints at runtime.
                        const wallMountLine = {
                            uuid: mountLineUuid,
                            type: NodeType.MountLine,
                            mountSlotTypes: [MountType.wall],
                            parent: wall2DId,
                            attributes: {},
                            children: mountLineChildren,
                            position: { x: 0, y: 0, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 }
                        };
                        newObjects[mountLineUuid] = wallMountLine;
                    }
                }
                roomSegments.push(segId);
            }
        }
        // Required Molding children (baseboard, decoMolding) — same pattern as
        // floorplan.ts createRoomFromSegments / createRoomFromPoints. They live
        // directly under the Room and reference roomAttribute formulas defined in
        // defaultRoomAttributes.
        const baseboardId = generateId();
        const decoMoldingId = generateId();
        const baseboardCatalog = importFromCatalog(core, 'master/Mouldings/Handle/baseboard');
        const decoMoldingCatalog = importFromCatalog(core, 'master/Mouldings/Handle/decoMolding');
        newObjects[baseboardId] = {
            ...baseboardCatalog,
            uuid: baseboardId,
            parent: oldRoom.uuid,
            children: [],
            attributes: { ...(baseboardCatalog.attributes || {}) }
        };
        newObjects[decoMoldingId] = {
            ...decoMoldingCatalog,
            uuid: decoMoldingId,
            parent: oldRoom.uuid,
            children: [],
            attributes: { ...(decoMoldingCatalog.attributes || {}) }
        };
        // Create New Room
        const newRoom = {
            uuid: oldRoom.uuid,
            type: NodeType.Room,
            parent: oldRoom.parent,
            path: roomSegments,
            holes: [], // Migrate holes if needed
            floor2D: oldRoom.floor2D,
            ceiling2D: oldRoom.ceiling2D,
            children: [baseboardId, decoMoldingId],
            attributes: { ...defaultRoomAttributes, ...(oldRoom.attributes || {}) }
        };
        const ceiling2D = newObjects[oldRoom.ceiling2D];
        if (ceiling2D) {
            const uuid = generateId();
            //insert a mount plane for each Ceiling2D for consistency
            ceiling2D.children.forEach((child) => {
                const childObject = newObjects[child];
                if (childObject) {
                    childObject.parent = uuid;
                }
            });
            const ceilingMountPlane = {
                uuid,
                type: NodeType.MountPlane,
                parent: oldRoom.ceiling2D,
                mountSlotTypes: [MountType.ceiling],
                attributes: {},
                children: ceiling2D.children,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            };
            newObjects[uuid] = ceilingMountPlane;
            newObjects[oldRoom.ceiling2D].children = [uuid];
        }
        const floor2D = newObjects[oldRoom.floor2D];
        if (floor2D) {
            const uuid = generateId();
            //insert a mount plane for each Floor2D for consistency
            floor2D.children.forEach((child) => {
                const childObject = newObjects[child];
                if (childObject) {
                    childObject.parent = uuid;
                }
            });
            const floorMountPlane = {
                uuid,
                type: NodeType.MountPlane,
                parent: oldRoom.floor2D,
                mountSlotTypes: [MountType.floor],
                attributes: {},
                children: floor2D.children,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 }
            };
            newObjects[uuid] = floorMountPlane;
            newObjects[oldRoom.floor2D].children = [uuid];
        }
        newObjects[newRoom.uuid] = newRoom;
    });
    // Compute correct floorplan camera and controls defaults from the original corner geometry
    // so the 3-D view starts at the right position without relying on scene bounding-box init.
    const cornerPositions = Object.values(data.objects3D)
        .filter((n) => n.type === 'Corner')
        .map((n) => ({ x: n.position.x, y: n.position.y }));
    const { floorplanCamera, controls } = buildFloorplanCameraDefaults(cornerPositions);
    console.log('convertAppData', floorplanCamera, controls, data.floorplanCamera, data.controls);
    // Re-inject the Floorplan stages parenting if strictly needed, though mostly handled by 'parent' prop preservation
    // Adjust the root AppData structure
    const newAppData = {
        ...data,
        floorplanCamera,
        controls,
        selectedObject: data.selectedObject ?? null,
        selectedSystem: null,
        objects3D: newObjects, // casting to satisfy type checker for mixed content
        objectsCalc: data.objectsCalc // casting to satisfy type checker for mixed content
    };
    for (let i = 0; i < stages.length; i += 1) {
        Reflect.deleteProperty(data.objects3D[stages[i]], 'corners');
    }
    return newAppData;
};
const convertMaster = ({ masterCatalog: master }) => {
    const posValues = [
        master?.Formulas?.General?.defaultPullPositionX,
        master?.Formulas?.General?.defaultPullPositionY
    ];
    const values = [
        master?.Models?.General?.secondOfThreeForIllusionDoorHandle?.position?.x,
        master?.Models?.General?.firstOfTwoForIllusionDoorHandle?.position?.x,
        master?.Models?.General?.secondOfTwoForIllusionDoorHandle?.position?.x,
        master?.Models?.General?.firstOfThreeForIllusionDoorHandle?.position?.x,
        master?.Models?.General?.thirdOfThreeForIllusionDoorHandle?.position?.x
    ];
    for (let i = 0; i < posValues.length; i += 1) {
        if (!posValues[i])
            continue;
        // const tmp: InterpretedLine[] = [];
        for (let j = 0; j < posValues[i].length; j += 1) {
            if (posValues[i][j].type === 'size') {
                const size = posValues[i][j].value;
                posValues[i].splice(j, 1, {
                    type: 'operator',
                    value: '('
                }, {
                    type: 'property',
                    value: 'isScalable'
                }, {
                    type: 'operator',
                    value: '?'
                }, {
                    type: 'size',
                    value: size
                }, {
                    type: 'operator',
                    value: ':'
                }, {
                    type: 'initialSize',
                    value: size
                }, {
                    type: 'operator',
                    value: ')'
                });
                j += 5;
            }
            else if (posValues[i][j].type === 'attribute' && posValues[i][j].value === 'PullLength') {
                // tmp.push({
                //   type: 'materialAttributeN',
                //   value: ['', 'drillingDistance']
                // });
                posValues[i].splice(j, 1, {
                    type: 'materialAttributeN',
                    value: ['', 'drillingDistance']
                });
            }
        }
    }
    for (let i = 0; i < values.length; i += 1) {
        if (!values[i])
            continue;
        for (let j = 0; j < values[i].length; j += 1) {
            if (values[i][j].type === 'attribute' && values[i][j].value === 'PullLength') {
                values[i][j] = {
                    type: 'materialAttributeN',
                    value: ['', 'drillingDistance']
                };
            }
        }
    }
    return master;
};

//@ts-nocheck
const defaultFirstHoleOffset = 9.5 / 25.4;
class ConverterVesta {
    static VESTA_FINAL_VERSION = 2000;
    static toCurrentVersion(json, core) {
        return ConverterVesta.convert(json, ConverterVesta.VESTA_FINAL_VERSION, core);
    }
    static convert(JSON, toVersion, core) {
        let converted = JSON;
        const fromVersion = JSON.projectSettings.version || 1000;
        if (fromVersion >= toVersion) {
            if (fromVersion === 1000) {
                converted.projectSettings.version = 1000;
            }
            return converted;
        }
        if (fromVersion < toVersion) {
            for (let i = fromVersion; i < toVersion; i += 1) {
                // @ts-ignore
                converted = this[`${i}To${i + 1}`](converted, core);
            }
            if (!import.meta.env.CATALOG && !import.meta.env.PRODUCT) {
                console.debug(`converted from ${fromVersion} to ${toVersion} : `, JSON, converted, core);
            }
            return converted;
        }
        const message = `Area with version ${fromVersion} cannot be opened in app version${toVersion}. Please contact your app administrator`;
        throw new Error(message);
    }
    static '1000To1001'(json) {
        const result = JSON.parse(JSON.stringify(json));
        console.log('json', 'result', json, result);
        result.projectSettings.version = 1001;
        result.projectSettings.roomSettings.printMode = {
            paperSizeRatio: { label: 'A4', value: 'A4' },
            cabinetNamesOnElevation: { label: '1', value: 1 }
        };
        return result;
    }
    static '1001To1002'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1002;
        Reflect.deleteProperty(result.projectSettings.projectAttributes, 'TopValanceRightReturn');
        Reflect.deleteProperty(result.projectSettings.projectAttributes, 'TopValanceLeftReturn');
        Reflect.deleteProperty(result.projectSettings.projectAttributes, 'TopValancePresent');
        Reflect.deleteProperty(result.projectSettings.projectAttributes, 'BottomValancePresent');
        result.projectSettings.projectAttributes.FinishEndConfigurationPrefix = {
            label: 'parts/FETypes/',
            value: 'parts/FETypes/'
        };
        Object.keys(result.projectSettings.materials.materialsSets).forEach((key) => {
            const set = result.projectSettings.materials.materialsSets[key];
            const { valance, edgebanding } = set;
            Reflect.deleteProperty(set, 'valance');
            result.projectSettings.materials.materialsSets[key] = {
                ...set,
                bodyEdgebanding: edgebanding,
                doorEdgebanding: edgebanding,
                finishEndEdgebanding: edgebanding,
                topValanceEdgebanding: edgebanding,
                bottomValanceEdgebanding: edgebanding,
                fillerEdgebanding: edgebanding,
                topValance: valance,
                bottomValance: valance
            };
        });
        if (result.appData.objects3D) {
            Object.keys(result.appData.objects3D).forEach((key) => {
                if (result.appData.objects3D[key].type === 'Valance') {
                    if (result.appData.objects3D[key].valanceType === 'top') {
                        result.appData.objects3D[key].valanceType = 'topValance';
                    }
                    if (result.appData.objects3D[key].valanceType === 'bottom') {
                        result.appData.objects3D[key].valanceType = 'bottomValance';
                    }
                }
            });
        }
        if (result.appData.objectsCalc) {
            Object.keys(result.appData.objectsCalc).forEach((key) => {
                if (result.appData.objectsCalc[key].type === 'Valance') {
                    if (result.appData.objectsCalc[key].valanceType === 'top') {
                        result.appData.objectsCalc[key].valanceType = 'topValance';
                    }
                    if (result.appData.objectsCalc[key].valanceType === 'bottom') {
                        result.appData.objectsCalc[key].valanceType = 'bottomValance';
                    }
                }
            });
        }
        return result;
    }
    static '1002To1003'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1003;
        Object.keys(result.projectSettings.materials.materialsSets).forEach((key) => {
            const set = result.projectSettings.materials.materialsSets[key];
            const { finishEnd } = set;
            result.projectSettings.materials.materialsSets[key] = {
                ...set,
                bottomFinishEnd: finishEnd
            };
        });
        ['drawerSlide', 'pull'].forEach((key) => {
            if (!result.projectSettings.materials[key] &&
                core.storage.get('materials').arr[key].length) {
                result.projectSettings.materials[key] = core.storage.get('materials').arr[key][0]._id;
            }
        });
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].type === 'Model' &&
                        // @ts-ignore
                        key[key2].modelType === 'handle') {
                        key[key2].modelType = 'pull';
                    }
                });
            }
        });
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].type === 'Model' &&
                        key[key2].modelType === 'pull') {
                        key[key2].materialId = result.projectSettings.materials.pull;
                        Reflect.deleteProperty(result.appData.objects3D[key2], 'modelSource');
                    }
                });
            }
        });
        return result;
    }
    static '1003To1004'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1004;
        Object.keys(result.projectSettings.materials.materialsSets).forEach((setId) => {
            result.projectSettings.materials.materialsSets[setId].doorsAndDrawersConfiguration =
                core.storage.get('materials').arr.doorStyle[0]._id;
            result.projectSettings.materials.materialsSets[setId].finishEndsConfiguration =
                core.storage.get('materials').arr.doorStyle[0]._id;
        });
        return result;
    }
    static '1004To1005'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1005;
        Object.keys(result.projectSettings.materials.materialsSets).forEach((setId) => {
            result.projectSettings.materials.materialsSets[setId].doorsAndDrawersConfiguration = 'Slab';
            result.projectSettings.materials.materialsSets[setId].door =
                core.storage.get('materials').arr.door[0]._id;
            result.projectSettings.materials.materialsSets[setId].finishEndsConfiguration = 'Slab';
            result.projectSettings.materials.materialsSets[setId].finishEnd =
                core.storage.get('materials').arr.door[0]._id;
        });
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].type === 'Part') {
                        if (key[key2].attributes &&
                            key[key2].attributes.Configuration &&
                            Array.isArray(key[key2].attributes.Configuration)) {
                            key[key2].attributes.Configuration.forEach((line, index, arr) => {
                                if (line.type === 'materialsSetStyleAttributeS' &&
                                    line.value[0] === 'doorsAndDrawersConfiguration' &&
                                    line.value[1] === 'doorStyle') {
                                    arr.splice(index, 1, {
                                        type: 'operator',
                                        value: '('
                                    }, {
                                        type: 'materialsSetAttribute',
                                        value: 'doorsAndDrawersConfiguration'
                                    }, {
                                        type: 'operator',
                                        value: '==="Slab"?"MelamineSlab"'
                                    }, {
                                        type: 'operator',
                                        value: ':'
                                    }, {
                                        type: 'materialsSetStyleAttributeS',
                                        value: ['door', 'doorStyle']
                                    }, {
                                        type: 'operator',
                                        value: ')'
                                    });
                                }
                                if (line.type === 'materialsSetStyleAttributeS' &&
                                    line.value[0] === 'finishEndsConfiguration' &&
                                    line.value[1] === 'doorStyle') {
                                    arr.splice(index, 1, {
                                        type: 'operator',
                                        value: '('
                                    }, {
                                        type: 'materialsSetAttribute',
                                        value: 'finishEndsConfiguration'
                                    }, {
                                        type: 'operator',
                                        value: '==="Slab"?"MelamineSlab"'
                                    }, {
                                        type: 'operator',
                                        value: ':'
                                    }, {
                                        type: 'materialsSetStyleAttributeS',
                                        value: ['finishEnd', 'doorStyle']
                                    }, {
                                        type: 'operator',
                                        value: ')'
                                    });
                                }
                            });
                        }
                        if (key[key2].doorStyleId) {
                            Reflect.deleteProperty(key[key2], 'doorStyleId');
                        }
                    }
                    if (key[key2].type === 'Panel' || key[key2].type === 'Frame') {
                        if (key[key2].materialId) {
                            Reflect.deleteProperty(key[key2], 'materialId');
                        }
                    }
                });
            }
        });
        return result;
    }
    static '1005To1006'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1006;
        result.projectSettings.projectAttributes.SecondPartTopValanceHeight = {
            label: '2',
            value: 2
        };
        result.projectSettings.projectAttributes.SecondPartTopValancePresent = {
            label: '0',
            value: 0
        };
        if (result.printMode) {
            result.printMode.showMainPage = true;
        }
        result.projectSettings.projectAttributes.ShelfConfigurationPrefix = {
            label: 'parts/shelfTypes/',
            value: 'parts/shelfTypes/'
        };
        return result;
    }
    static '1006To1007'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1007;
        result.projectSettings.projectAttributes.ShelfConfigurationPrefix = {
            label: 'master/Shelf Types/General/',
            value: 'master/Shelf Types/General/'
        };
        result.projectSettings.projectAttributes.FinishEndConfigurationPrefix = {
            label: 'master/Finish End Types/General/',
            value: 'master/Finish End Types/General/'
        };
        result.projectSettings.projectAttributes.SingleDoorConfigurationPrefix = {
            label: 'master/Single Door Types/General/',
            value: 'master/Single Door Types/General/'
        };
        result.projectSettings.projectAttributes.SingleDrawerConfigurationPrefix = {
            label: 'master/Drawer Types/General/',
            value: 'master/Drawer Types/General/'
        };
        result.projectSettings.projectAttributes.DoubleDoorConfigurationPrefix = {
            label: 'master/Double Door Types/General/',
            value: 'master/Double Door Types/General/'
        };
        result.projectSettings.projectAttributes.FalsePanelConfigurationPrefix = {
            label: 'master/False Types/General/',
            value: 'master/False Types/General/'
        };
        if (result.printMode) {
            result.printMode.cameraDistanceFromWall = 30;
        }
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].attributes &&
                        typeof key[key2].attributes.MirrorShape === 'string') {
                        key[key2].attributes.MirrorShape = key[key2].attributes.MirrorShape.replace(/shapes\//gi, 'master/Shapes/General/');
                    }
                    if (typeof key[key2].shape === 'string') {
                        key[key2].shape = key[key2].shape.replace(/shapes\//gi, 'master/Shapes/General/');
                    }
                    else if (Array.isArray(key[key2].shape)) {
                        key[key2].shape.forEach((iValue) => {
                            if (typeof iValue.value === 'string') {
                                iValue.value = iValue.value.replace(/shapes\//gi, 'master/Shapes/General/');
                                iValue.value = iValue.value.replace(/grooveDoor\/g/gi, 'grooveDoorG');
                            }
                        });
                    }
                    else if (typeof key[key2].shape === 'object') {
                        if (typeof key[key2].shape.source === 'string') {
                            key[key2].shape.source = key[key2].shape.source.replace(/shapes\//gi, 'master/Shapes/General/');
                        }
                    }
                    if (typeof key[key2].contour === 'string') {
                        key[key2].contour = key[key2].contour.replace(/shapes\//gi, 'master/Shapes/General/');
                    }
                });
            }
        });
        return result;
    }
    static '1007To1008'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1008;
        result.projectSettings.roomSettings.ambientLightIntensity = 1;
        return result;
    }
    static '1008To1009'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1009;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].modelSource) {
                        key[key2].modelType = 'applianceModel';
                        let modelId = '';
                        switch (key[key2].modelSource.path) {
                            default:
                                console.log('Model path not found :', key[key2]);
                                modelId = '';
                                break;
                            case './assets/models/appliances/base/Footboard001.glb':
                                modelId = '775415af-eecc-41cb-8b9e-d8cf446434c1';
                                break;
                            case './assets/models/appliances/base/BarStoolWhite0.glb':
                                modelId = '07595689-c297-4caf-901b-5b1e93e015fa';
                                break;
                            case './assets/models/appliances/base/BarStoolWhite1.glb':
                                modelId = '6cba5ed7-6e36-415a-afbd-342abb55d650';
                                break;
                            case './assets/models/appliances/base/BarStoolWhite2.glb':
                                modelId = '67ef0370-5923-438a-b969-27ccf61f448b';
                                break;
                            case './assets/models/appliances/base/BarStoolWhite3.glb':
                                modelId = '619a943e-454a-4b81-a25d-6132bf7b8603';
                                break;
                            case './assets/models/appliances/base/BarStoolWhite4.glb':
                                modelId = '0ca88c48-eaab-43b8-b2e2-253dc8f3a6b3';
                                break;
                            case './assets/models/appliances/base/BarStoolBlackLeather0.glb':
                                modelId = 'bcffa148-a9b6-4214-b33d-dbeb4e3c4da7';
                                break;
                            case './assets/models/appliances/base/BarStoolBlackLeather1.glb':
                                modelId = 'b85433eb-2841-482d-8cf8-19946d1ea803';
                                break;
                            case './assets/models/appliances/base/BarStoolBlackLeather2.glb':
                                modelId = 'bef27fb3-6408-4bf8-99cc-9cd123fe81d2';
                                break;
                            case './assets/models/appliances/base/BarStoolBlackLeather3.glb':
                                modelId = 'e345b58d-a9fd-491c-8b4d-febc30d48d2d';
                                break;
                            case './assets/models/appliances/base/BarStoolBlackLeather4.glb':
                                modelId = '902584a8-2b86-414a-8945-8819e930c50e';
                                break;
                            case './assets/models/appliances/base/BarStoolBlackLeather5.glb':
                                modelId = '6882a76c-82cb-4a9a-9d6c-0a633fa3f788';
                                break;
                            case './assets/models/appliances/tall/Stairs001.glb':
                                modelId = '02a081d4-a5a2-4227-9cf7-bbba7983deb3';
                                break;
                            case './assets/models/appliances/tall/Stairs002left.glb':
                                modelId = '1935e6c1-95be-4b87-abc6-6e379a5e6c31';
                                break;
                            case './assets/models/appliances/tall/Stairs002left2.glb':
                                modelId = '84e8054a-971b-425d-8308-4df0368db38e';
                                break;
                            case './assets/models/appliances/tall/Stairs002left3.glb':
                                modelId = '36bffab5-30bd-49ab-8dd9-fc63e1e86d94';
                                break;
                            case './assets/models/appliances/tall/Stairs002right.glb':
                                modelId = '2b9b2cb8-69e9-4b56-aaca-7b381242e4d8';
                                break;
                            case './assets/models/appliances/tall/Stairs002right2.glb':
                                modelId = 'abdfc963-b047-406a-b795-30d50cbec70d';
                                break;
                            case './assets/models/appliances/tall/Stairs002right3.glb':
                                modelId = '2a20d8fb-776b-47ad-b6e5-8fa057a37999';
                                break;
                            case './assets/models/appliances/base/WF50R8500AVW.glb':
                                modelId = '75d49863-c508-49a2-901c-861fc160c16b';
                                break;
                            case './assets/models/appliances/base/WF50R8500AVB.glb':
                                modelId = '31131535-6c18-417c-988c-c2a39ec033e1';
                                break;
                            case './assets/models/appliances/base/DVE50R8500VW.glb':
                                modelId = 'e25ab60b-51b6-4475-9dcc-33cf785d3afc';
                                break;
                            case './assets/models/appliances/base/DVE50R8500VB.glb':
                                modelId = '58f484ae-84fe-4b01-977b-5512817ebcb2';
                                break;
                            case './assets/models/appliances/base/TopLoader_01.glb':
                                modelId = '54de14ea-65de-4c19-b1ce-aa121ebfc10a';
                                break;
                            case './assets/models/appliances/base/TopLoader_02.glb':
                                modelId = '7b6d9a79-40e4-43a5-8908-5b0b09256e0c';
                                break;
                            case './assets/models/appliances/base/TopLoader_03.glb':
                                modelId = '8d31b72b-2980-4b72-a5a4-93f841388d4a';
                                break;
                            case './assets/models/appliances/base/TopLoader_04.glb':
                                modelId = '221cfacd-747b-4f35-b1f1-b43ad1388dba';
                                break;
                            case './assets/models/appliances/base/TopLoader_05.glb':
                                modelId = 'b81e0408-cbe4-484c-ab7a-41777efe1218';
                                break;
                            case './assets/models/appliances/base/TopLoader_06.glb':
                                modelId = 'e9670c0c-11dd-4914-a045-ad986881887a';
                                break;
                            case './assets/models/appliances/base/TopLoader_07.glb':
                                modelId = 'b98e4f81-7dfe-4576-b1f4-45faa003d1b8';
                                break;
                            case './assets/models/appliances/base/Bed001.glb':
                                modelId = 'f66ca6e3-c0a0-4841-bada-1c87a89aca95';
                                break;
                            case './assets/models/appliances/base/Sofa001.glb':
                                modelId = '88dcf947-0ac5-45ca-8edc-326a839b860f';
                                break;
                            case './assets/models/appliances/base/Armchair001.glb':
                                modelId = '512ae1a6-8c35-4270-ab1d-8d2b29deca83';
                                break;
                            case './assets/models/appliances/base/Table001.glb':
                                modelId = '0a00d711-e259-4486-8bc3-820fe5176411';
                                break;
                            case './assets/models/appliances/base/Toilet001.glb':
                                modelId = 'a05121c1-0394-4e0b-b7c0-5ec2aab579cc';
                                break;
                            case './assets/models/appliances/base/Chair001.glb':
                                modelId = '48f715a5-e2ec-44f1-ac2c-0384f34224f5';
                                break;
                            case './assets/models/appliances/base/DeskChair001.glb':
                                modelId = 'cf411ee7-e802-40c1-940d-45b05345ffc2';
                                break;
                            case './assets/models/appliances/base/DinnerTable001.glb':
                                modelId = 'bef2e800-a550-437b-8fc6-8afba3c405b8';
                                break;
                            case './assets/models/appliances/base/lamps/blackLamp.glb':
                                modelId = '701a84f4-0e0c-48bb-9ade-b86809c0b516';
                                break;
                            case './assets/models/appliances/base/kitchenStoveGas/PRG304GH.glb':
                                modelId = 'cc6c7609-202d-4530-8289-b8fc71adf64d';
                                break;
                            case './assets/models/appliances/base/kitchenStoveGas/PRG364JDG.glb':
                                modelId = 'cf30fab0-16e1-46f0-acc3-ff939a255d0a';
                                break;
                            case './assets/models/appliances/base/kitchenStoveGas/kitchenStoveGas.glb':
                                modelId = '0c9116c9-951d-40c4-a54b-ddabc17c01a6';
                                break;
                            case './assets/models/appliances/base/ElectricStove001.glb':
                                modelId = '6d25bb05-91e4-4d4e-927c-ed757e479709';
                                break;
                            case './assets/models/appliances/base/kitchenStoveGas/PRD486GDHU.glb':
                                modelId = '2c3d01f4-6482-45a8-a74a-1447f4371ef6';
                                break;
                            case './assets/models/appliances/base/kitchenStoveGas/PRD486JDGU.glb':
                                modelId = '02eb6e00-aac1-4014-a5fe-88298cb7c493';
                                break;
                            case './assets/models/appliances/base/Toilette/Toilette.glb':
                                modelId = '881fd3c6-a553-4fea-b0e3-6303da0613a6';
                                break;
                            case './assets/models/appliances/base/BathroomTub/BathroomTub1.glb':
                                modelId = '3d018e9a-be9b-471d-822b-ec3cf1265169';
                                break;
                            case './assets/models/appliances/base/BathroomTub/BathroomTub2.glb':
                                modelId = '5a1d6dbb-4a87-4b3b-ac70-9299ef85d207';
                                break;
                            case './assets/models/appliances/base/BathroomTub/BathroomTub3.glb':
                                modelId = 'c5aeee58-115c-48d6-8e15-9a6619219e8d';
                                break;
                            case './assets/models/appliances/base/BathroomTub/BathroomTub4.glb':
                                modelId = '02daa347-81f2-4ed3-9227-bd2f929ece8a';
                                break;
                            case './assets/models/appliances/base/Flower/Plant1.glb':
                                modelId = '338dc7a0-6031-4ff2-8b7e-238b06dcbba9';
                                break;
                            case './assets/models/appliances/base/Flower/Plant3.glb':
                                modelId = 'a06fb749-f656-482e-b233-20cc181dc20f';
                                break;
                            case './assets/models/appliances/base/Flower/Plant5.glb':
                                modelId = 'e16bd043-11f8-4fa8-8931-b6277558fa49';
                                break;
                            case './assets/models/appliances/base/Flower/Plant7.glb':
                                modelId = '49f2884e-dc3d-4b41-acec-e959bb1a36e6';
                                break;
                            case './assets/models/appliances/base/Flower/Plant8.glb':
                                modelId = '72d48727-36fa-4e1a-9e1b-929adfa56125';
                                break;
                            case './assets/models/appliances/base/Furniture/Dining.glb':
                                modelId = 'd3b91d71-e52b-4fb1-97d5-9441098be11a';
                                break;
                            case './assets/models/appliances/base/Table/Roundtable.glb':
                                modelId = '8b9515b2-b850-43dc-ab3f-d6833e198007';
                                break;
                            case './assets/models/appliances/base/Table/WoodenKitchenTable.glb':
                                modelId = 'e5c737e3-806f-4c01-9624-c5c6742b90a9';
                                break;
                            case './assets/models/showerCabins/Cabine5.glb':
                                modelId = '8f4877a4-3a7e-4212-802a-1b8453c57e73';
                                break;
                            case './assets/models/showerCabins/Cabine4.glb':
                                modelId = 'cbed01c7-55e9-4da8-992d-2f5d939672c0';
                                break;
                            case './assets/models/showerCabins/Cabine3.glb':
                                modelId = '94c3b54f-3217-405c-ae02-e2723377e1b7';
                                break;
                            case './assets/models/showerCabins/Cabine2.glb':
                                modelId = 'a1077f46-c412-4914-a14f-b7856f46dd65';
                                break;
                            case './assets/models/showerCabins/Cabine1.glb':
                                modelId = '9de58fc7-4394-4a76-a47e-d463b323a03a';
                                break;
                            case './assets/models/appliances/tall/kitchenFridge/kitchenFridge.glb':
                                modelId = '9f0c78ea-32b2-4a4d-ae2b-8d2aaf957169';
                                break;
                            case './assets/models/appliances/tall/T18IW800SP.glb':
                                modelId = '5d1c6254-85a9-4aee-b6b8-270d678c2c30';
                                break;
                            case './assets/models/appliances/tall/T36BT810NS.glb':
                                modelId = 'f504ab8c-d7df-4442-919e-8c2e705b05e4';
                                break;
                            case './assets/models/appliances/tall/T36IT71NNP.glb':
                                modelId = '177930cf-3a5b-4f80-a936-2cd25a99b7f9';
                                break;
                            case './assets/models/appliances/tall/FridgeLR/FridgeLeft.glb':
                                modelId = '057adf6f-ca0a-4063-8071-8f307b01859d';
                                break;
                            case './assets/models/appliances/tall/FridgeLR/FridgeRight.glb':
                                modelId = '7224d733-e3e1-46fe-b073-d73e43aeb32b';
                                break;
                            case './assets/models/appliances/tall/WineFridge/WineFridge.glb':
                                modelId = 'bde63067-b652-49e0-a5e9-4b1cfb415188';
                                break;
                            case './assets/models/appliances/upper/StillnessT945-4.glb':
                                modelId = '5de11647-bcfd-4621-b949-bb46dc4cb75f';
                                break;
                            case './assets/models/appliances/upper/TV001.glb':
                                modelId = '6bf84fd6-6f26-4b3f-b48b-5ad083d59038';
                                break;
                            case './assets/models/appliances/upper/Shower001.glb':
                                modelId = '9417b51f-f660-42f3-b3fc-5d08a81a8a7c';
                                break;
                            case './assets/models/appliances/upper/Outlet001.glb':
                                modelId = 'e8982e3e-4a44-4d61-a593-00aad94f54d7';
                                break;
                            case './assets/models/appliances/upper/lamps/lamp008.glb':
                                modelId = '30265a41-0b38-437a-b2df-ef97d3486050';
                                break;
                            case './assets/models/appliances/upper/lamps/lamp009.glb':
                                modelId = '58be3873-c072-4c5b-814a-eced4bb78f65';
                                break;
                            case './assets/models/appliances/upper/lamps/lamp010.glb':
                                modelId = 'af848ff9-62f0-4788-8f5f-98e09d3849d9';
                                break;
                            case './assets/models/appliances/upper/lamps/lamp011.glb':
                                modelId = '80753b32-06bc-484f-a52f-81d7e0aafc77';
                                break;
                            case './assets/models/appliances/upper/islandHood/islandHood.glb':
                                modelId = '5e184c95-3a90-4288-abe7-40fbc46110c0';
                                break;
                            case './assets/models/appliances/upper/kitchenHood/kitchenHood.glb':
                                modelId = 'f5447f3d-eacd-46e8-bd46-19a69654176c';
                                break;
                            case './assets/models/microwaves/Microwave.glb':
                                modelId = '8c2716b6-6caf-4c2e-8c8d-3fd4179d3ec9';
                                break;
                            case './assets/models/appliances/upper/hood001/Vent.glb':
                                modelId = '4af1f03b-e773-4799-917b-62e8d570d87f';
                                break;
                            case './assets/models/appliances/upper/lamps/blackLamp.glb':
                                modelId = '701a84f4-0e0c-48bb-9ade-b86809c0b516';
                                break;
                            case './assets/models/sinks/kitchenSinkOctave3842/Octave3842.glb':
                                modelId = '38ee2e4e-af30-4ec8-bbdb-5cb6fe64a361';
                                break;
                            case './assets/models/sinks/Bachata2609MU.glb':
                                modelId = '40b6303e-ffa8-404f-bc82-46471a417ea7';
                                break;
                            case './assets/models/sinks/Bachata2609SU.glb':
                                modelId = 'c5d73ea7-eaf2-4143-8116-ebcc03ef8691';
                                break;
                            case './assets/models/sinks/Briolette2373.glb':
                                modelId = '4f1fab00-7867-4fac-8128-4e211832ae7a';
                                break;
                            case './assets/models/sinks/Brookline2202.glb':
                                modelId = 'c295fd8b-3ce4-4bef-a634-fa9b4a1f4822';
                                break;
                            case './assets/models/sinks/Bryant2699.glb':
                                modelId = 'a0aa21e5-bbb6-4d7a-a02b-ca9fa8e8c8a4';
                                break;
                            case './assets/models/sinks/Bryant2714.glb':
                                modelId = '997ba6c9-9091-4b65-8e35-5a79236e171c';
                                break;
                            case './assets/models/sinks/Camber2349.glb':
                                modelId = 'e9130799-cdc2-46b4-81db-cfe2cf326b1b';
                                break;
                            case './assets/models/sinks/Carillon7799.glb':
                                modelId = '9c414974-c195-4392-879a-db76819d408f';
                                break;
                            case './assets/models/sinks/SinkUnder001.glb':
                                modelId = '4e5d2c7c-5d94-4d1a-88d6-60c532caad8b';
                                break;
                            case './assets/models/cooktops/gasstove3.glb':
                                modelId = 'f08a8233-33e1-4d2c-b0dc-fd01d7ccfc37';
                                break;
                            case './assets/models/cooktops/cooktop.glb':
                                modelId = '9dc4de88-56ea-40ad-a23e-d409d23ac2b4';
                                break;
                            case './assets/models/appliances/countertop/CoffeeMachine001.glb':
                                modelId = '622b26ca-cedf-4ada-9fb9-6aea329ebfbf';
                                break;
                            case './assets/models/appliances/countertop/toaster001.glb':
                                modelId = '2f41205b-8960-4d6c-b2cb-09f89c169f3e';
                                break;
                            case './assets/models/appliances/countertop/teapot001.glb':
                                modelId = '14f207b3-14ab-4102-aa21-b7b74ff0837b';
                                break;
                            case './assets/models/appliances/countertop/plate001.glb':
                                modelId = '9c3d7bb0-b154-46b3-a6cf-ccb7aacbeb1b';
                                break;
                            case './assets/models/appliances/countertop/mac001.glb':
                                modelId = 'd4bf7548-66f1-4409-8ddf-95b192356b40';
                                break;
                            case './assets/models/appliances/countertop/tablet001.glb':
                                modelId = '98de426d-32a9-438f-bb55-b6d022bb52f7';
                                break;
                            case './assets/models/appliances/countertop/wine001.glb':
                                modelId = '7723a044-f1de-450c-b1ba-c75b096f2abd';
                                break;
                            case './assets/models/appliances/countertop/basketofapples001.glb':
                                modelId = '9f871d7d-b699-4793-a88c-20c6c3d9ef7a';
                                break;
                            case './assets/models/appliances/countertop/ceramic001.glb':
                                modelId = '25c22706-7966-449d-80ac-35a7c4041ace';
                                break;
                            case './assets/models/appliances/countertop/cuttingboard001.glb':
                                modelId = 'b6f52990-d94e-4c87-9b38-6fe5beccf7fd';
                                break;
                            case './assets/models/appliances/countertop/glass002.glb':
                                modelId = '916f5a65-10b1-4484-9f84-b64cb36c26f8';
                                break;
                            case './assets/models/appliances/countertop/skillet001.glb':
                                modelId = 'a9b67a7d-a487-4ba1-aabb-4df23537fc03';
                                break;
                            case './assets/models/appliances/upper/lamps/bathroomvanitylight001.glb':
                                modelId = 'dd842e87-0694-4f3c-8154-7fd6d5f59767';
                                break;
                            case './assets/models/appliances/countertop/candleholder001.glb':
                                modelId = '55ee5afb-4a04-4437-8e94-5a6aeb57637f';
                                break;
                            case './assets/models/appliances/countertop/bowls001.glb':
                                modelId = '06ec6c5f-1796-4b33-a283-1d438ddc3d0c';
                                break;
                            case './assets/models/appliances/countertop/Bottles001.glb':
                                modelId = 'cb396269-2741-42b7-afd6-ae3515b36f96';
                                break;
                            case './assets/models/appliances/countertop/lamp004.glb':
                                modelId = 'ff29bb54-7960-420e-a3c2-bbcb4bfe7e22';
                                break;
                            case './assets/models/appliances/countertop/lamp005.glb':
                                modelId = '8885bcb3-4f1d-4284-b3a2-e0551d81529e';
                                break;
                            case './assets/models/appliances/countertop/lamp006.glb':
                                modelId = '7f748bf7-9fc9-4948-a269-eb1c203a4d26';
                                break;
                            case './assets/models/appliances/countertop/lamp007.glb':
                                modelId = 'e51c2302-9ac8-4fa3-88f6-b1fb95f77b9c';
                                break;
                            case './assets/models/appliances/countertop/Glass/Glass.glb':
                                modelId = '8d4b39d1-c146-488a-a3ab-0b1d93219c5e';
                                break;
                            case './assets/models/appliances/base/Flower/Alocasia.glb':
                                modelId = 'eda130d1-d3c3-46d7-af50-edfce985e453';
                                break;
                            case './assets/models/appliances/base/Flower/BoxwoodPlant.glb':
                                modelId = '80c04313-581b-4447-b11c-8a60cbe38bf1';
                                break;
                            case './assets/models/appliances/base/Flower/Plant2.glb':
                                modelId = 'e543d369-7c2f-47bc-b255-fb9aa501b8f9';
                                break;
                            case './assets/models/appliances/base/Flower/Plant4.glb':
                                modelId = '05c11fd6-e9fb-4566-91ae-54dcbfe17a5f';
                                break;
                            case './assets/models/appliances/base/Flower/Plant6.glb':
                                modelId = '90e3a10e-2b7c-4276-a089-08d7215ae2a1';
                                break;
                            case './assets/models/appliances/ceiling/builtinLight.glb':
                                modelId = '794a139e-48f2-4a7b-b738-b82e13bbf386';
                                break;
                            case './assets/models/appliances/ceiling/lamp001.glb':
                                modelId = '7911b09d-3a77-4c32-a588-4ef54a60fc58';
                                break;
                            case './assets/models/appliances/ceiling/lamp002.glb':
                                modelId = '8a2e9d88-36a8-4164-a840-0269b8848ae0';
                                break;
                            case './assets/models/appliances/ceiling/lamp003.glb':
                                modelId = 'b48bef22-7565-4040-8da7-bee58aee7919';
                                break;
                            case './assets/models/appliances/ceiling/lamp012.glb':
                                modelId = '8c464d0d-063d-41bb-95c3-2b4a4886e7fa';
                                break;
                            case './assets/models/appliances/ceiling/lamp013.glb':
                                modelId = '658dbf54-2217-45a9-aade-ce012b2335ef';
                                break;
                            case './assets/models/appliances/ceiling/VentPYRAMIDA.glb':
                                modelId = 'eb1bbc1a-1dbb-440d-9c49-befb6175d035';
                                break;
                            case './assets/models/faucets/S-HKSN-001S.glb':
                                modelId = '1340c5d7-28b7-490d-80b7-06f8cd1c5d5b';
                                break;
                            case './assets/models/faucets/Refinia5317-4.glb':
                                modelId = 'b0094e77-834c-4d84-b8cb-d511b1249887';
                                break;
                            case './assets/models/faucets/Toobi8959-7.glb':
                                modelId = '39d54273-c287-431d-9e4d-c32cf5d7e1a4';
                                break;
                            case './assets/models/faucets/WillametteR99900-4D.glb':
                                modelId = '6f02842e-5c6c-4d50-902d-0e91dfee8e7d';
                                break;
                            case './assets/models/showerCabins/showerCabin1.glb':
                                modelId = 'a7a2347f-2123-456a-9e5f-69e367b9fe9d';
                                break;
                            case './assets/models/showerCabins/frameShowerCabin1.glb':
                                modelId = '4bb24f55-5a13-4ca4-b9c5-93cbf587ee64';
                                break;
                            case './assets/models/windows/window001.glb':
                                modelId = 'e8fb5b19-76b0-4a67-bea5-a0dc6220449d';
                                break;
                            case './assets/models/accessories/clothes/clothes001.glb':
                                modelId = 'acb96e0f-194d-46c2-9f63-8368e842cf64';
                                break;
                            case './assets/models/appliances/base/BaseFridge/BaseFridge.glb':
                                modelId = '63d215a7-5257-42e7-99dd-ca5744750f94';
                                break;
                            case './assets/models/appliances/base/dishwasher_GE_CDWT280VSS_DC/dishwasher_GE_CDWT280VSS_DC.glb':
                                modelId = 'aad14f3c-8aa2-4378-8c85-0e6947ff0cb2';
                                break;
                            case './assets/models/microwaves/BuiltInMicrowave.glb':
                                modelId = '7b58bdf0-5766-4ce3-ae80-03c24a7296a7';
                                break;
                            case './assets/models/ovens/builtinoven1.glb':
                                modelId = 'cdd487ef-ac2e-4954-afce-9e3605d02656';
                                break;
                            case './assets/models/ovens/builtinoven2.glb':
                                modelId = '0b5d1ba8-daeb-4735-8b69-db1670fdeda3';
                                break;
                        }
                        key[key2].modelId = modelId;
                        Reflect.deleteProperty(key[key2], 'modelSource');
                    }
                });
            }
        });
        return result;
    }
    static '1009To1010'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1010;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((objects) => {
            if (objects) {
                Object.keys(objects).forEach((uuid) => {
                    if (objects[uuid].type === 'Item') {
                        objects[uuid].extra = { accessory: [] };
                    }
                });
            }
        });
        if (result.printMode?.views) {
            Object.keys(result.printMode.views).forEach((key) => {
                result.printMode.views[key].extraSpace = { top: 10, bottom: 10, left: 10, right: 10 };
            });
        }
        return result;
    }
    static '1010To1011'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1011;
        if (result.printMode?.pages) {
            Object.keys(result.printMode.pages).forEach((key) => {
                result.printMode.pages[key].texts = {};
                result.printMode.pages[key].textsFS = result.printMode?.fontSize || 24;
            });
        }
        if (result.printMode?.views) {
            Object.keys(result.printMode.views).forEach((key) => {
                if (!result.printMode.views[key].extraSpace) {
                    result.printMode.views[key].extraSpace = { left: 10, right: 10, top: 10, bottom: 10 };
                }
            });
        }
        [result.appData.objects3D, result.appData.objectsCalc].forEach((objects) => {
            if (objects) {
                Object.keys(objects).forEach((uuid) => {
                    if (objects[uuid].type === 'Item' && objects[uuid].itemType === 'column') {
                        if (!objects[objects[uuid].children[0]]) {
                            objects[objects[uuid].parent].children.splice(objects[objects[uuid].parent].children.indexOf(uuid), 1);
                            Object.keys(objects).forEach((key) => {
                                if (objects[key].children) {
                                    if (objects[key].children.indexOf(uuid) !== -1) {
                                        objects[key].children.splice(objects[key].children.indexOf(uuid), 1);
                                    }
                                }
                            });
                            Reflect.deleteProperty(objects, objects[uuid].children[0]);
                            Reflect.deleteProperty(objects, uuid);
                        }
                    }
                });
            }
        });
        return result;
    }
    static '1011To1012'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1012;
        result.projectSettings.roomSettings.printMode.cabinetNamesOnFloor = {
            label: '1',
            value: 1
        };
        return result;
    }
    static '1012To1013'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1013;
        if (core.storage.get('materials').arr.laminate.length) {
            result.projectSettings.materials.laminate =
                core.storage.get('materials').arr.laminate[0]._id;
        }
        [
            '7223D35F-E343-453E-A335-92B38025C94D',
            '62A4CE4F-8602-4FD1-B563-CB0454B6FFFF',
            '262824D0-CFDB-49A5-82E4-2014E9C059C4',
            '14ABBF9C-CDDA-4C4F-A105-8922493797C8'
        ].forEach((uuid) => {
            if (result.appData.objects3D &&
                result.appData.objects3D[uuid] &&
                result.appData.objects3D[uuid].attributes) {
                result.appData.objects3D[uuid].attributes.HideInCalculation = 1;
            }
        });
        Object.keys(result.projectSettings.materials.materialsSets).forEach((key) => {
            const set = result.projectSettings.materials.materialsSets[key];
            result.projectSettings.materials.materialsSets[key] = {
                ...set,
                visibleCarcass: set.visiblePanel,
                visibleCarcassEdgebanding: set.edgebanding
            };
        });
        return result;
    }
    static '1013To1014'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1014;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((objects) => {
            if (objects) {
                Object.keys(objects).forEach((uuid) => {
                    if (objects[uuid].type === 'Item' &&
                        objects[uuid].attributes &&
                        objects[uuid].attributes.HideInCalculation !== undefined) {
                        objects[uuid].HideInCalculation = objects[uuid].attributes.HideInCalculation;
                        Reflect.deleteProperty(objects[uuid].attributes, 'HideInCalculation');
                    }
                });
            }
        });
        return result;
    }
    static '1014To1015'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1015;
        if (core.storage.get('materials').arr.laminate.length) {
            result.projectSettings.materials.laminate =
                core.storage.get('materials').arr.laminate[0]._id;
        }
        return result;
    }
    static '1015To1016'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1016;
        Reflect.deleteProperty(result.projectSettings, 'looks');
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].materialId) {
                        let materialId = '';
                        switch (key[key2].materialId) {
                            default:
                                return;
                            case '57aaddbe-7d25-4667-ad28-cf195b35dc90':
                                materialId = 'fa75cda5-4af2-436c-81d0-dba44fefda21';
                                break;
                            case 'dd26981c-b7ac-4e48-9d43-38a4691f3a97':
                                materialId = '1b8ee7c5-bdc8-451a-a889-34fa5b280492';
                                break;
                            // // TRIAL;
                            // 14-5;
                            case 'd4bbefe8-ab52-4f29-b54e-caab888914ab':
                                materialId = 'f4ee0af6-0a10-4201-ba06-3f9d66a274c8';
                                break;
                            // 5-75;
                            case 'f9f812fa-5740-458c-a688-cbc255bbb7b0':
                                materialId = '845e44c8-3639-416b-9bf2-8583c2f5d1cc';
                                break;
                            // // BBCDS
                            // Leg Levler
                            case '5cd232db-b448-4611-92e9-cdf174adec10':
                                materialId = '576a6336-0a5f-44f0-8d8d-e6f9cfd9b53f';
                                break;
                            // BP149
                            case '59ffb4da-f2ed-4849-9ad2-72747ccb2259':
                            case '94f134f7-abf0-4201-919f-bcdfe92b53fd':
                                materialId = '6567c72e-79d7-407d-b128-d8197f2f512f';
                                break;
                            // 5-75
                            case '5e3aadc4-40f5-4028-af99-3225f2113eff':
                            case '8a1ac261-3a56-4a74-a244-a0698bae67ea':
                            case 'b8d2b91a-2a24-402c-a537-60100245fc7c':
                                materialId = '5266039d-418e-4bf4-a301-b3345bc0a565';
                                break;
                            // 14-5
                            case '1d02fb82-4e9a-4aee-89c3-1cad2877b69f':
                                materialId = 'a048080a-d591-404d-b4bc-2e1721ed2648';
                                break;
                            // Wire Straight 3.75 inch
                            case 'a2e7e734-660c-4300-9486-37152fd2c0a3':
                                materialId = '7eea2d3a-6775-4907-986f-4f9f4f119ad9';
                                break;
                            // // BIGO
                            // 5-75
                            case 'f6a17abc-b8f0-4334-862d-c43ad30ed73c':
                                materialId = '3333ce49-a706-4f84-98fa-b1de80f952a8';
                                break;
                            // // CC2000
                            // Shell
                            case 'f6e91784-5b4e-403d-a590-d6b17346ab81':
                                materialId = 'c5e9f062-da66-464b-9b98-c40d9ba0d048';
                                break;
                            // // DENCA
                            // Amerock BP55273BBR Blackrock Large Sq. Knob. 38mm. Black Bronze
                            case 'cb2d8904-4b8f-455b-91a0-1c9816fb8463':
                                materialId = '25587e86-8494-4f28-b44e-947fb039d99c';
                                break;
                            // // DOCO
                            // 14-5
                            case '017ec9ec-3098-4153-ac63-c2bcf19ba15a':
                                materialId = 'a4e22e87-fe1c-4964-b89a-a836c9c670a3';
                                break;
                            // Plastic Leg Levlers
                            case 'cc825df1-5666-4d31-abc3-fb59058bfff2':
                                materialId = 'c0fdd307-7c8d-483a-b4c0-3594dcf29ed1';
                                break;
                            // 5-75
                            case '2967b538-61b1-4ac0-a46e-23c2fe5ad2f8':
                            case '6b9dbd7f-f0d4-47a2-82d4-9c5126adacf4':
                                materialId = 'e595bc48-5230-448e-84df-ae9c36d9102d';
                                break;
                            // // SUNRIZE
                            // 14-5
                            case '88318e7d-f82e-4556-a278-72a4f06ff196':
                                materialId = '28700ed7-f3b6-452d-bc92-cc72fbd34f91';
                                break;
                            // 5-75
                            case 'c2d09bb0-7133-4132-b8fd-b8a7d996e80c':
                                materialId = 'b4e2bed5-8a22-4df9-b15e-a9b9ac7839e3';
                                break;
                        }
                        if (materialId !== '') {
                            // console.log( `replace ${ ( key[ key2 ].materialId ) } to ${ materialId }` );
                            key[key2].materialId = materialId;
                        }
                    }
                    if (key[key2].materialId === '') {
                        if (key[key2].type === 'Floor2D') {
                            key[key2].materialId = result.projectSettings.materials.floor;
                        }
                        else if (key[key2].type === 'Wall2D') {
                            key[key2].materialId = result.projectSettings.materials.wall;
                        }
                        else if (key[key2].type === 'Ceiling2D') {
                            key[key2].materialId = result.projectSettings.materials.ceiling;
                        }
                    }
                });
            }
        });
        return result;
    }
    static '1016To1017'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1017;
        result.projectSettings.projectAttributes.DrawerBoxType = {
            label: 'Melamine Box',
            value: 'MelamineBox'
        };
        return result;
    }
    static '1017To1018'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1018;
        ['hingeBlind', 'hingeCornerCorner', 'hingeCornerDiagonal', 'hingeLiftUp'].forEach((key) => {
            if (!result.projectSettings.materials[key]) {
                result.projectSettings.materials[key] = core.storage.get('materials').arr[key].length
                    ? core.storage.get('materials').arr[key][0]._id
                    : '';
            }
        });
        return result;
    }
    static '1018To1019'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1019;
        if (result.printMode) {
            result.printMode.wallViewType = 'wallProductsOnly';
        }
        return result;
    }
    static '1019To1020'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1020;
        if (result.appData.objects3D) {
            Object.keys(result.appData.objects3D).forEach((key) => {
                if (result.appData.objects3D[key].type === 'Model') {
                    const parent = result.appData.objects3D[key].parent;
                    if (result.appData.objects3D[parent] &&
                        result.appData.objects3D[parent].type === 'Item' &&
                        result.appData.objects3D[parent].mountType === 'sink') {
                        result.appData.objects3D[key].position.x = 0;
                        result.appData.objects3D[key].position.z = 0;
                    }
                }
            });
        }
        return result;
    }
    static '1020To1021'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1021;
        result.projectSettings.projectAttributes.SecondPartTopValanceType = {
            label: 'panel',
            value: 'panel'
        };
        return result;
    }
    static '1021To1022'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1022;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].attributes) {
                        if (key[key2].attributes.IntegratedLeftFinishEndGrain) {
                            key[key2].attributes.LeftFinishEndGrain = key[key2].attributes.IntegratedLeftFinishEndGrain;
                            Reflect.deleteProperty(key[key2].attributes, 'IntegratedLeftFinishEndGrain');
                        }
                        if (key[key2].attributes.IntegratedRightFinishEndGrain) {
                            key[key2].attributes.RightFinishEndGrain = key[key2].attributes.IntegratedRightFinishEndGrain;
                            Reflect.deleteProperty(key[key2].attributes, 'IntegratedRightFinishEndGrain');
                        }
                    }
                });
            }
        });
        return result;
    }
    static '1022To1023'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1023;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].type === 'CrownMolding') {
                        key[key2].lookId =
                            core.storage.get('materials').obj.crownMolding[key[key2]?.materialId].lookId || 'unknown';
                    }
                });
            }
        });
        return result;
    }
    static '1023To1024'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1024;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (['flip', 'drawer', 'pullout'].includes(key[key2]?.attributes?.DoorOpenType)) {
                        key[key2].attributes.SwingHandleRotation = 'horizontal';
                    }
                });
            }
        });
        return result;
    }
    static '1024To1025'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1025;
        result.projectSettings.projectAttributes.HandleType = { label: 'Model', value: 'Model' };
        if (!result.projectSettings.materials.extrusionPull &&
            core.storage.get('materials').arr.extrusionPull.length) {
            result.projectSettings.materials.extrusionPull =
                core.storage.get('materials').arr.extrusionPull[0]._id;
        }
        return result;
    }
    static '1025To1026'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1026;
        result.projectSettings.projectAttributes.CarcassMaterialOnly = {
            label: '0',
            value: 0
        };
        return result;
    }
    static '1026To1027'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1027;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2] &&
                        key[key2].partType === 'shelf') {
                        key[key2].position = {
                            x: 'master/Formulas/General/shelfTypesMelamineSlabPositionXold',
                            y: 0,
                            z: 0
                        };
                        key[key2].size = {
                            x: [
                                {
                                    type: 'partSize',
                                    value: 'z'
                                }
                            ],
                            y: 'master/Formulas/General/shelfTypesMelamineSlabSizeYold',
                            z: 'master/Formulas/General/shelfTypesMelamineSlabSizeZold'
                        };
                        key[key2].rotation = {
                            x: 'master/Formulas/General/shelfTypesMelamineSlabRotationXold',
                            y: 'master/Formulas/General/shelfTypesMelamineSlabRotationYold',
                            z: 'master/Formulas/General/shelfTypesMelamineSlabRotationZold'
                        };
                    }
                });
            }
        });
        return result;
    }
    static '1027To1028'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1028;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2] &&
                        key[key2].shelfShape) {
                        if (key[key2].shelfShape.includes('master/Shapes/General/cornerDiagonal')) {
                            key[key2].shelfShape = 'master/Shapes/General/cornerDiagonalOld';
                        }
                        else if (key[key2].shelfShape.includes('master/Shapes/General/cornerCorner')) {
                            key[key2].shelfShape = 'master/Shapes/General/cornerCornerOld';
                        }
                    }
                });
            }
        });
        return result;
    }
    static '1028To1029'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1029;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2] &&
                        key[key2].isShelfPanel &&
                        key[key2].shape.length === 4 &&
                        key[key2].shape[3].value.includes('rectangleShelf')) {
                        key[key2].shape = [
                            {
                                type: 'boxContainerProperty',
                                value: 'shelfShape'
                            },
                            {
                                type: 'operator',
                                value: '?'
                            },
                            {
                                type: 'boxContainerProperty',
                                value: 'shelfShape'
                            },
                            {
                                type: 'operator',
                                value: ':((('
                            },
                            {
                                type: 'partAttribute',
                                value: 'Layout'
                            },
                            {
                                type: 'operator',
                                value: '||'
                            },
                            {
                                type: 'boxContainerLayout',
                                value: 'Interior'
                            },
                            {
                                type: 'operator',
                                value: ')==="WIDTH")?"master/Shapes/General/rectangleShelfVertical":"master/Shapes/General/rectangleShelf")'
                            }
                        ];
                    }
                });
            }
        });
        return result;
    }
    static '1029To1030'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1030;
        result.projectSettings.projectAttributes.FullTopPanel = {
            label: '0',
            value: 0
        };
        result.projectSettings.projectAttributes.IntegratedBottomFinishEnd = {
            label: '1',
            value: 1
        };
        return result;
    }
    static '1030To1031'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1031;
        Object.values(result.projectSettings.materials.materialsSets).forEach((set) => {
            set.melamineBox = set.body;
            set.melamineBoxEdgebanding = set.bodyEdgebanding;
        });
        return result;
    }
    static '1031To1032'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1032;
        if (result.printMode) {
            result.printMode.offsetLeft = 0;
            result.printMode.offsetRight = 0;
        }
        if (!result.projectSettings.materials.rod && core.storage.get('materials').arr.rod.length) {
            result.projectSettings.materials.rod = core.storage.get('materials').arr.rod[0]._id;
        }
        return result;
    }
    static '1032To1033'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1033;
        if (result.projectSettings) {
            Object.values(result.projectSettings.materials.materialsSets).forEach((set, index) => {
                set.name = set.name || `Set ${index + 1}`;
            });
        }
        return result;
    }
    static '1033To1034'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1034;
        result.projectSettings.projectAttributes.DrawerBoxMaterialOnly = {
            label: '0',
            value: 0
        };
        return result;
    }
    static '1034To1035'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1035;
        result.projectSettings.itemNumber = 1;
        return result;
    }
    static '1035To1036'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1036;
        result.projectSettings.projectAttributes.FlushPanels = {
            label: '0',
            value: 0
        };
        return result;
    }
    static '1036To1037'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1037;
        result.projectSettings.projectAttributes.ToeKickStretcher = {
            label: '0',
            value: 0
        };
        return result;
    }
    static '1037To1038'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1038;
        if (result.projectSettings) {
            Object.values(result.projectSettings.materials.materialsSets).forEach((set) => {
                if (!set.finishEndGrain) {
                    set.finishEndGrain = JSON.parse(JSON.stringify(set.doorGrain));
                }
            });
        }
        return result;
    }
    static '1038To1039'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1039;
        if (!result.projectSettings.materials.hingeBiFoldLift &&
            core.storage.get('materials').arr.hingeBiFoldLift.length) {
            result.projectSettings.materials.hingeBiFoldLift =
                core.storage.get('materials').arr.hingeBiFoldLift[0]._id;
        }
        return result;
    }
    static '1039To1040'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1040;
        if (!result.projectSettings.materials.stockMaterialsSets) {
            result.projectSettings.materials.stockMaterialsSets = {};
        }
        return result;
    }
    static '1040To1041'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1041;
        result.projectSettings.projectAttributes.CountertopPresent = {
            label: '1',
            value: 1
        };
        return result;
    }
    static '1041To1042'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1042;
        result.projectSettings.projectAttributes.BBNotchHeight = {
            label: '0',
            value: 0
        };
        result.projectSettings.projectAttributes.BBNotchDepth = {
            label: '0',
            value: 0
        };
        result.projectSettings.projectAttributes.SQRNotchHeight = {
            label: '0',
            value: 0
        };
        result.projectSettings.projectAttributes.SQRNotchDepth = {
            label: '0',
            value: 0
        };
        result.projectSettings.projectAttributes.QRPresent = {
            label: '0',
            value: 0
        };
        return result;
    }
    static '1042To1043'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1043;
        result.projectSettings.projectAttributes.RailNotchHeight = {
            label: '2.75',
            value: 2.75
        };
        result.projectSettings.projectAttributes.RailNotchPresent = {
            label: '0',
            value: 0
        };
        result.projectSettings.projectAttributes.RailNotchDepth = {
            label: '0.5',
            value: 0.5
        };
        result.projectSettings.projectAttributes.RailNotchPosition = {
            label: '5.5',
            value: 5.5
        };
        return result;
    }
    static '1043To1044'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1044;
        if (result.projectSettings) {
            if (!result.projectSettings.materials.closetMaterialsSets) {
                result.projectSettings.materials.closetMaterialsSets = {};
            }
            [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
                if (key) {
                    Object.keys(key).forEach((key2) => {
                        if (key[key2].type === 'Item' &&
                            (key[key2].isSingleCloset ||
                                key[key2].isMultiCloset) &&
                            Object.keys(result.projectSettings?.materials.materialsSets || []).includes(key[key2].materialsSet)) {
                            const uuid = generateId();
                            result.projectSettings.materials.closetMaterialsSets[uuid] = JSON.parse(JSON.stringify(result.projectSettings.materials.materialsSets[key[key2].materialsSet]));
                            key[key2].materialsSet = uuid;
                        }
                    });
                }
            });
            if (!Object.keys(result.projectSettings.materials.closetMaterialsSets).length) {
                result.projectSettings.materials.closetMaterialsSets[generateId()] = {
                    ...result.projectSettings.materials.materialsSets[result.projectSettings.materials.defaultMaterialsSet]
                };
            }
            result.projectSettings.materials.defaultClosetMaterialsSet = Object.keys(result.projectSettings.materials.closetMaterialsSets)[0];
        }
        return result;
    }
    static '1044To1045'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1045;
        if (result.projectSettings) {
            result.projectSettings.materials.defaultClosetMaterialsSet = Object.keys(result.projectSettings.materials.closetMaterialsSets)[0];
        }
        return result;
    }
    static '1045To1046'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1046;
        if (result.projectSettings) {
            result.projectSettings.projectAttributes.ClosetToeKickHeight = {
                label: '64',
                value: (64 / 25.4)
            };
        }
        return result;
    }
    static '1046To1047'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1047;
        if (result.projectSettings) {
            result.projectSettings.materials.windowGlass =
                core.storage.get('materials').arr.windowGlass[0]._id;
            result.projectSettings.materials.doorGlass =
                core.storage.get('materials').arr.doorGlass[0]._id;
            result.projectSettings.materials.mirror = core.storage.get('materials').arr.mirror[0]._id;
        }
        return result;
    }
    static '1047To1048'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1048;
        if (result.projectSettings) {
            const f = (a) => JSON.parse(JSON.stringify(a));
            result.projectSettings.projectAttributes.BaseClosetDepth = f(result.projectSettings.projectAttributes.BaseCabinetDepth);
            result.projectSettings.projectAttributes.BaseClosetHeight = f(result.projectSettings.projectAttributes.BaseCabinetHeight);
            result.projectSettings.projectAttributes.UpperClosetDepth = f(result.projectSettings.projectAttributes.UpperCabinetDepth);
            result.projectSettings.projectAttributes.UpperClosetHeight = f(result.projectSettings.projectAttributes.UpperCabinetHeight);
            result.projectSettings.projectAttributes.TallClosetDepth = f(result.projectSettings.projectAttributes.TallCabinetDepth);
            result.projectSettings.projectAttributes.TallClosetHeight = f(result.projectSettings.projectAttributes.TallCabinetHeight);
        }
        return result;
    }
    static '1048To1049'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1049;
        if (result.projectSettings) {
            result.projectSettings.projectAttributes.FirstHoleDirection = {
                value: 'bottom',
                label: 'bottom'
            };
            result.projectSettings.projectAttributes.FirstHoleOffset = {
                value: defaultFirstHoleOffset,
                label: String(defaultFirstHoleOffset)
            };
            result.projectSettings.projectAttributes.LastHoleOffset = {
                value: defaultFirstHoleOffset,
                label: String(defaultFirstHoleOffset)
            };
            result.projectSettings.projectAttributes.FaciaToeKick = {
                label: '0',
                value: 0
            };
        }
        return result;
    }
    static '1049To1050'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1050;
        let wallNumber = 1;
        [result.appData.objects3D, result.appData.objectsCalc].forEach((key) => {
            if (key) {
                Object.keys(key).forEach((key2) => {
                    if (key[key2].type === 'Wall3D') {
                        key[key2].wallNumber = wallNumber;
                        wallNumber += 1;
                    }
                });
            }
        });
        result.projectSettings.wallNumber = wallNumber;
        return result;
    }
    static '1050To1051'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1051;
        if (result.projectSettings) {
            result.projectSettings.projectAttributes.TieredCrownNumber = {
                label: '0',
                value: 0
            };
        }
        return result;
    }
    static '1051To1052'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1052;
        if (result.projectSettings) {
            result.projectSettings.projectAttributes.UpperClosetRoundSides = {
                label: '0',
                value: 0
            };
        }
        return result;
    }
    static '1052To1053'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1053;
        const materials = core.storage.get('materials').arr.drawerSlideUndermount;
        if (result.projectSettings) {
            result.projectSettings.projectAttributes.DrawerSlideType = {
                label: 'side mount',
                value: 'sidemount'
            };
            result.projectSettings.materials.drawerSlideUndermount = materials.length
                ? materials[0]._id
                : '';
        }
        return result;
    }
    static '1053To1054'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1054;
        result.projectSettings.roomSettings.disabledAmbientIntensity = 3;
        result.projectSettings.roomSettings.spotLightsPower = 1;
        result.projectSettings.roomSettings.ambientLightIntensity = Math.min(result.projectSettings.roomSettings.ambientLightIntensity, 1);
        return result;
    }
    static '1054To1055'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1055;
        if (result.projectSettings) {
            result.projectSettings.projectAttributes.ClosetLeftGap = {
                label: '0',
                value: 0
            };
            result.projectSettings.projectAttributes.ClosetRightGap = {
                label: '0',
                value: 0
            };
        }
        return result;
    }
    static '1055To1056'(json) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1056;
        if (result.projectSettings) {
            result.projectSettings.projectAttributes.ClosetTopGap = {
                label: '1',
                value: 1
            };
            result.projectSettings.projectAttributes.ClosetBottomGap = {
                label: '1',
                value: 1
            };
        }
        return result;
    }
    static '1056To1057'(json, core) {
        const result = JSON.parse(JSON.stringify(json));
        result.projectSettings.version = 1057;
        if (result.projectSettings) {
            if (!result.projectSettings.materials.pole &&
                core.storage.get('materials').arr.pole.length) {
                result.projectSettings.materials.pole = core.storage.get('materials').arr.pole[0]._id;
            }
        }
        return result;
    }
    static '1057To2000'(core, data, coreMode) {
        data.projectSettings.version = 2000;
        data.masterCatalog = convertMaster(data);
        core.storage.set('catalog', { master: data.masterCatalog, private: data.privateCatalog });
        data.appData = convertAppData(core, data);
        Reflect.deleteProperty(data.projectSettings.projectAttributes, 'HandleSource');
        // Strip {label, value} wrappers + inject v2000+ defaults — produces plain IProjectSettings
        const convertedSettings = convertProjectSettings(data.projectSettings);
        // Apply optional-settings defaults (mobile/web) on the already-plain type
        data.projectSettings = convertOptionalSettings(coreMode, convertedSettings);
        return data;
    }
}

export { ConverterVesta, defaultFirstHoleOffset };
