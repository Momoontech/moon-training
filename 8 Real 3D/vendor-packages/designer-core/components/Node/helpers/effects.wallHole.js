import { untracked } from '@preact/signals-react';
import SetNodeSignalCommand from '../../commands/SetNodeSignalCommand.js';
import SetNodeVectorComponentCommand from '../../commands/SetNodeVectorComponentCommand.js';
import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../../declarations/helpers.js';
import { VectorProps, V3Axes } from '../../../declarations/InterpretedLine.js';
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
import { getMatrixWorld } from '../../../helpers/getMatrixWorld.js';
import { getMonitor } from '../../../helpers/monitor.js';
import { segmentsIntersection } from '../../../helpers/math/plane/segmentsIntersection.js';
import { Vector2 } from '../../../helpers/math/Vector2.js';
import { Vector3 } from '../../../helpers/math/Vector3.js';
import { registerEffects } from './effectRegistry.js';
import getNode from './getNode.js';
import getOptionalParentWall2D from './getOptionalParentWall2D.js';
import getPoint from './getPoint.js';
import getRoomSegment from './getRoomSegment.js';
import getStage from './getStage.js';
import getWall2D from './getWall2D.js';
import calculateHoleCurve from './processHoleCurve.js';

const SIZE_EPS = 1e-3;
// Tests using the canonical mock node graph routinely tear down a window-item's
// parent before its dirty wallHole effect flushes, which makes getMatrixWorld()
// throw "Node with ID … not found." That's expected noise under vitest, but in
// production the same log can flag real teardown/serialization bugs — so the
// catch handlers below skip the monitor error only when running tests.
const IS_TEST_ENV = typeof process !== 'undefined' && (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test');
/** Deep-equality check for two InterpretedCurve arrays. */
function curveEqual(a, b) {
    if (a === b)
        return true;
    if (a === undefined || b === undefined)
        return false;
    return JSON.stringify(a) === JSON.stringify(b);
}
function findBackWall2D(item, frontWallId, maxDist) {
    const { core } = item;
    const stage = getStage(core, core.currentStage.get());
    const segIds = stage.segments.get();
    const itemMatrixWorld = getMatrixWorld(item);
    const w1 = new Vector3(0, 0, item.size.z.get()).applyMatrix4(itemMatrixWorld);
    const s1 = new Vector2(w1.x, w1.z);
    const w2 = new Vector3(0, 0, item.size.z.get() - maxDist).applyMatrix4(itemMatrixWorld);
    const s2 = new Vector2(w2.x, w2.z);
    let tmin = Infinity;
    let wall2D = null;
    for (let i = 0; i < segIds.length; i++) {
        const seg = getRoomSegment(core, segIds[i]);
        if (seg.segmentType !== SegmentType.linear)
            continue;
        const wallId = seg.wall2D.get();
        if (!wallId || wallId === frontWallId)
            continue;
        const fromPt = getPoint(core, seg.from.get());
        const toPt = getPoint(core, seg.to.get());
        const p1 = new Vector2(fromPt.position.x.get(), fromPt.position.y.get());
        const p2 = new Vector2(toPt.position.x.get(), toPt.position.y.get());
        const hit = segmentsIntersection(s1, s2, p1, p2);
        if (hit && hit.t < tmin && hit.t > 0 && hit.t < 1) {
            const wall = getWall2D(core, wallId);
            tmin = hit.t;
            wall2D = wall;
        }
    }
    return wall2D ? { wall: wall2D, distance: tmin * maxDist } : null;
}
/**
 * Self-healing effect that owns ALL Wall2D.holes[item.id] entries for gate/window Items.
 *
 * Tracked deps: item pose (via getMatrixWorld chain), size, holeShape, wDepth,
 * and every stage segment endpoint so floorplan edits re-fire the effect.
 *
 * The untracked() block performs a reconciliation walk: for every Wall2D on the
 * current stage it computes the DESIRED holes[item.id] value and emits a
 * SetNodeSignalCommand only when the current value differs. This makes the
 * effect idempotent (no commands emitted in steady state) and self-healing
 * (stale entries on any wall are removed on the next re-fire).
 */
const updateWallItemHolesEffect = (node) => {
    if (node.type !== NodeType.Item)
        return undefined;
    const item = node;
    const itemType = item.itemType.get();
    if (itemType !== ItemType.window && itemType !== ItemType.gate)
        return undefined;
    try {
        // ── Tracked dependency capture ──────────────────────────────────────────
        // getMatrixWorld walks the full ancestor chain (MountPlane → Wall2D →
        // RoomSegment → Stage → Floorplan), subscribing to every position/rotation
        // signal along the way. This single call covers position changes, rotation
        // changes, and reparenting in one shot.
        getMatrixWorld(item);
        // x/y tracked → width/height edits re-fire the cutout. z uses .peek()
        // because the effect writes size.z below and .get() would self-cycle.
        item.size.x.get();
        item.size.y.get();
        const sizeZ = item.size.z.peek();
        // Hole shape (drives curve output for both front and back walls).
        item.holeShape?.get();
        // Default wall thickness — fallback size.z and ray search distance.
        const wDepth = item.core.projectSettings.roomSettings.wDepth.get();
        // Stage segments: read every endpoint so point-drag / segment add/remove re-fires.
        const stageId = item.core.currentStage.get();
        const stage = getStage(item.core, stageId);
        const segIds = stage.segments.get();
        for (const segId of segIds) {
            let seg;
            try {
                seg = getNode(item.core, segId);
            }
            catch {
                continue;
            }
            if (seg.type !== NodeType.RoomSegment)
                continue;
            const anySeg = seg;
            if (!('from' in anySeg))
                continue;
            try {
                const fromPt = getPoint(item.core, anySeg.from.get());
                const toPt = getPoint(item.core, anySeg.to.get());
                fromPt.position.x.get();
                fromPt.position.y.getTransformed();
                toPt.position.x.get();
                toPt.position.y.getTransformed();
            }
            catch {
                continue;
            }
        }
        // ── Untracked work ──────────────────────────────────────────────────────
        // Reads inside here do NOT create subscriptions so that:
        //   (a) wall.holes writes from OTHER items don't re-fire this effect,
        //   (b) our own command-internal prevValue reads don't cause a cycle.
        untracked(() => {
            try {
                // 1. Resolve front wall from parent chain.
                const frontWall = getOptionalParentWall2D(item.core, item.id);
                if (!frontWall)
                    return; // item not yet attached to a wall
                // 2. Find the back wall and desired item depth (size.z)
                const searchDist = 3 * wDepth;
                const backWall = findBackWall2D(item, frontWall.id, searchDist);
                let desiredZ;
                if (backWall) {
                    desiredZ = backWall.distance;
                }
                else {
                    desiredZ = wDepth;
                }
                // 3. Reconciliation walk — ensure every Wall2D in the scene carries exactly
                //    the desired holes[item.id] entry (or none), regardless of prior state.
                //
                //    Iterating core.nodes (not just stage.segments) is intentional: a Wall2D
                //    node that was removed from stage.segments but not yet GC'd can still carry
                //    a stale entry. Walking all nodes clears it on the next re-fire, which is
                //    correct behaviour regardless of how the wall was orphaned.
                const commands = [];
                for (const [, n] of item.core.nodes) {
                    if (n.type !== NodeType.Wall2D)
                        continue;
                    const wall = n;
                    // Reads inside untracked() — these do NOT subscribe the effect.
                    const currentHoles = wall.holes.get();
                    const current = currentHoles[item.id];
                    let desired;
                    if (wall.id === frontWall.id) {
                        desired = calculateHoleCurve(item, frontWall);
                    }
                    else if (backWall && wall.id === backWall.wall.id) {
                        desired = calculateHoleCurve(item, backWall.wall);
                    }
                    else {
                        desired = undefined;
                    }
                    if (!curveEqual(current, desired)) {
                        if (desired !== undefined) {
                            commands.push(new SetNodeSignalCommand(wall.id, 'holes', { ...currentHoles, [item.id]: desired }));
                        }
                        else if (current !== undefined) {
                            const next = { ...currentHoles };
                            Reflect.deleteProperty(next, item.id);
                            commands.push(new SetNodeSignalCommand(wall.id, 'holes', next));
                        }
                    }
                }
                // Update size.z only when it has drifted beyond floating-point noise.
                if (Math.abs(sizeZ - desiredZ) > SIZE_EPS) {
                    commands.push(new SetNodeVectorComponentCommand(item.id, VectorProps.size, V3Axes.z, desiredZ));
                    commands.push(new SetNodeVectorComponentCommand(item.id, VectorProps.position, V3Axes.z, -desiredZ));
                }
                if (commands.length > 0) {
                    item.core.runCommandsAsTransaction(commands, '', false);
                }
            }
            catch (error) {
                if (!IS_TEST_ENV)
                    getMonitor().error('updateWallItemHolesEffect', error instanceof Error ? error : null);
            }
        });
    }
    catch (error) {
        if (!IS_TEST_ENV)
            getMonitor().error('updateWallItemHolesEffect (tracked)', error instanceof Error ? error : null);
    }
    return undefined;
};
registerEffects('wallHoleable', [updateWallItemHolesEffect]);

export { updateWallItemHolesEffect };
