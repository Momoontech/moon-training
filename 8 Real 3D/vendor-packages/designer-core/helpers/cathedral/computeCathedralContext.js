import getNode from '../../components/Node/helpers/getNode.js';
import getPoint from '../../components/Node/helpers/getPoint.js';
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
import { SegmentType } from '../../declarations/Segment.js';
import { CeilingType } from '../../declarations/SurfaceSettings.js';
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { getMonitor } from '../monitor.js';
import getAttributeValue from '../getAttributeValue.js';
import { buildBaseWallFrame, toBaseCoords, fromBaseCoords } from './baseWallFrame.js';
import { clipPolygonToStrip } from './clipPolygonToStrip.js';
import { extendProfileToCoverFootprint } from './extendProfileToCoverFootprint.js';
import { evalProfileH } from './profileH.js';

const FLAT_CONTEXT = { type: CeilingType.Flat };
/**
 * Computes everything wall and ceiling rendering need for the cathedral case.
 *
 * Coordinate convention: all 2D points live in the **floorplan-local
 * rendered frame** — i.e. `Point.position.y.getTransformed()` is used for Y
 * — so that the resulting facet polygons (lifted to 3D with Z = height) land
 * directly in the same frame the Floor2D / Ceiling2D groups already use.
 *
 * Returns `{ type: Flat }` when the room is not in cathedral mode or when
 * required attributes / structures are missing.
 */
const computeCathedralContext = (room) => {
    const ceilingType = getAttributeValue(room, 'CeilingType');
    if (ceilingType === CeilingType.Flat) {
        return FLAT_CONTEXT;
    }
    const baseWallId = getAttributeValue(room, 'CeilingBaseWallId');
    if (!baseWallId) {
        getMonitor().warn('Cathedral context: missing CeilingBaseWallId on room', room.id);
        return FLAT_CONTEXT;
    }
    const rawPoints = getAttributeValue(room, 'BaseWallPoints');
    if (!Array.isArray(rawPoints) || rawPoints.length < 2) {
        getMonitor().warn('Cathedral context: BaseWallPoints must have at least 2 points', room.id, rawPoints);
        return FLAT_CONTEXT;
    }
    const profile = [];
    for (const p of rawPoints) {
        if (!p ||
            typeof p !== 'object' ||
            typeof p.x !== 'number' ||
            typeof p.y !== 'number') {
            getMonitor().warn('Cathedral context: invalid BaseWallPoints entry', room.id, p);
            return FLAT_CONTEXT;
        }
        profile.push({ x: p.x, y: p.y });
    }
    profile.sort((a, b) => a.x - b.x);
    const core = room.core;
    // Resolve the base Wall2D and walk to its parent RoomSegment.
    let baseWall;
    try {
        baseWall = getNode(core, baseWallId);
    }
    catch {
        getMonitor().warn('Cathedral context: base wall not found', baseWallId);
        return FLAT_CONTEXT;
    }
    if (baseWall.type !== NodeType.Wall2D) {
        getMonitor().warn('Cathedral context: CeilingBaseWallId does not reference a Wall2D', baseWallId);
        return FLAT_CONTEXT;
    }
    const baseSegment = getNode(core, baseWall.parent.get());
    if (baseSegment.type !== NodeType.RoomSegment || baseSegment.segmentType !== SegmentType.linear) {
        getMonitor().warn('Cathedral context: base wall parent is not a linear RoomSegment', baseWallId);
        return FLAT_CONTEXT;
    }
    const baseFromPoint = getPoint(core, baseSegment.from.get());
    const baseToPoint = getPoint(core, baseSegment.to.get());
    const baseFrame = buildBaseWallFrame({ x: baseFromPoint.position.x.get(), y: baseFromPoint.position.y.getTransformed() }, { x: baseToPoint.position.x.get(), y: baseToPoint.position.y.getTransformed() });
    if (baseFrame.length === 0) {
        getMonitor().warn('Cathedral context: base wall has zero length', baseWallId);
        return FLAT_CONTEXT;
    }
    // Walk the room footprint to collect wall segments and per-segment endpoints.
    const segmentIds = room.path.get();
    if (segmentIds.length < 3)
        return FLAT_CONTEXT;
    const walls = [];
    const footprint = [];
    for (const segId of segmentIds) {
        const seg = getNode(core, segId);
        if (seg.type !== NodeType.RoomSegment)
            continue;
        if (seg.segmentType !== SegmentType.linear) {
            getMonitor().warn('Cathedral context: non-linear segments are not supported yet', segId);
            return FLAT_CONTEXT;
        }
        const fromP = getPoint(core, seg.from.get());
        const toP = getPoint(core, seg.to.get());
        const from = { x: fromP.position.x.get(), y: fromP.position.y.getTransformed() };
        const to = { x: toP.position.x.get(), y: toP.position.y.getTransformed() };
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const width = Math.sqrt(dx * dx + dy * dy);
        footprint.push(from);
        const wallId = seg.wall2D.get();
        if (wallId)
            walls.push({ wallId, from, to, width });
    }
    if (footprint.length < 3)
        return FLAT_CONTEXT;
    // Project every footprint vertex into base-wall coords; use those to extend
    // the profile so it covers the full base-X range of the room.
    let xMin = Infinity;
    let xMax = -Infinity;
    for (const v of footprint) {
        const bx = toBaseCoords(v, baseFrame).x;
        if (bx < xMin)
            xMin = bx;
        if (bx > xMax)
            xMax = bx;
    }
    const extendedProfile = extendProfileToCoverFootprint(profile, xMin, xMax);
    // Per-wall top profile in wall-local 2D.
    const wallTopProfiles = new Map();
    for (const w of walls) {
        wallTopProfiles.set(w.wallId, computeWallTopProfile(w, baseFrame, extendedProfile));
    }
    // Per-segment ceiling facets, clipped to the room footprint.
    const ceilingFacets = [];
    // Footprint expressed in base-wall coords (clipping is cheap here).
    const footprintBase = footprint.map((v) => toBaseCoords(v, baseFrame));
    for (let k = 0; k < extendedProfile.length - 1; k += 1) {
        const a = extendedProfile[k];
        const b = extendedProfile[k + 1];
        const stripMin = Math.min(a.x, b.x);
        const stripMax = Math.max(a.x, b.x);
        if (stripMax - stripMin < 1e-9)
            continue;
        const clippedBase = clipPolygonToStrip(footprintBase, stripMin, stripMax);
        if (clippedBase.length < 3)
            continue;
        const polygon = clippedBase.map((p) => {
            const world = fromBaseCoords(p, baseFrame);
            const t = (p.x - a.x) / (b.x - a.x);
            const z = a.y + t * (b.y - a.y);
            return { x: world.x, y: world.y, z };
        });
        ceilingFacets.push({ polygon, baseProfileSegment: [a, b] });
    }
    return {
        type: CeilingType.Cathedral,
        baseWallId,
        wallTopProfiles,
        ceilingFacets
    };
};
const computeWallTopProfile = (w, baseFrame, extendedProfile) => {
    const xFromBase = toBaseCoords(w.from, baseFrame).x;
    const xToBase = toBaseCoords(w.to, baseFrame).x;
    const dxBase = xToBase - xFromBase;
    // Endpoints in wall-local x.
    const points = [
        { x: 0, y: evalProfileH(extendedProfile, xFromBase) },
        { x: w.width, y: evalProfileH(extendedProfile, xToBase) }
    ];
    // Insert kink points wherever an extended-profile knot's x_base falls
    // strictly between the wall's from/to x_base. Using an open interval avoids
    // duplicating the endpoint knots.
    if (Math.abs(dxBase) > 1e-9) {
        const lo = Math.min(xFromBase, xToBase);
        const hi = Math.max(xFromBase, xToBase);
        for (const knot of extendedProfile) {
            if (knot.x <= lo || knot.x >= hi)
                continue;
            const t = (knot.x - xFromBase) / dxBase;
            const localX = t * w.width;
            points.push({ x: localX, y: knot.y });
        }
    }
    // Sort by ascending wall-local x so consumers can build the polyline directly.
    points.sort((a, b) => a.x - b.x);
    return points;
};

export { computeCathedralContext };
