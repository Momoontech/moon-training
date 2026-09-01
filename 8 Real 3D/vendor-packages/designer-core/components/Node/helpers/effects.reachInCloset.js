import { untracked } from '@preact/signals-react';
import SetNodeSignalCommand from '../../commands/SetNodeSignalCommand.js';
import SetNodeVector2Command from '../../commands/SetNodeVector2Command.js';
import '../../../declarations/Attributes.js';
import '../../../declarations/BoxContainer.js';
import '../../../declarations/CoreDesigner.js';
import '../../../declarations/Edgebanding.js';
import '../../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../../declarations/helpers.js';
import { VectorProps } from '../../../declarations/InterpretedLine.js';
import '../../../declarations/Loader.js';
import '../../../declarations/Model.js';
import '../../../declarations/Molding.js';
import { NodeType } from '../../../declarations/Node.js';
import '../../../declarations/Panel.js';
import '../../../declarations/PaperSpace.js';
import '../../../declarations/Part.js';
import '../../../declarations/ProjectSettings.js';
import '../../../declarations/Segment.js';
import '../../../declarations/SurfaceSettings.js';
import '../../../declarations/systems.js';
import '../../../declarations/UIAttributes.js';
import '../../../declarations/Valance.js';
import '../../../declarations/views.js';
import { getMonitor } from '../../../helpers/monitor.js';
import { computeDependentRoomPoints } from '../../../helpers/reachInCloset/dependentRoomPoints.js';
import { createDependentRoomForReachInCloset, rebuildDependentRoomSegments } from '../../../helpers/reachInCloset/createDependentRoom.js';
import getStage from './getStage.js';
import getNode from './getNode.js';
import getRoomSegment from './getRoomSegment.js';
import getPoint from './getPoint.js';
import { registerEffects } from './effectRegistry.js';

const POINT_EPS = 1e-3;
/**
 * Maintains the dependent `Room` (`roomType: reachInCloset`) attached to a
 * `reachInCloset` Item.
 *
 * Tracked dependencies (auto-subscribed inside the effect body):
 * - `closet.roomShape` — its formula tokens read closet attributes (LeftDepth,
 *   RightDepth, etc.) and `size`, so attribute / size edits invalidate;
 * - `getMatrixWorld(closet)` walks the entire ancestor chain (MountPlane →
 *   Wall2D → RoomSegment → Stage → Floorplan) reading every position /
 *   rotation / point signal along the way, so any pose change re-fires;
 * - `closet.roomId` — its presence/absence (and whether the referenced Room
 *   actually exists) determines whether we spawn a fresh dependent Room or
 *   just sync points on an existing one.
 *
 * The effect is bookkeeping, not a user action: every command it emits goes
 * through `runCommandsAsTransaction(..., '', false)` so it nests into
 * whichever outer transaction is currently open (catalog drop, drag,
 * attribute edit, undo, redo) and never produces its own undo step.
 *
 * Branches:
 * 1.  `roomId === null` — first run after construction. Spawn a brand-new
 *     Room subtree at the current footprint and write `closet.roomId`.
 *     Skipped on degenerate shapes (<3 points).
 * 1b. `roomId !== null` but `getNode(roomId)` throws — STALE `roomId`. The
 *     closet was restored from a snapshot that carries its previous
 *     `roomId`, but the Room it points at is no longer in `core.nodes`.
 *     Two real-world paths hit this:
 *     - Catalog-drop redo: `CreateNodeFromCatalogCommand.savedObjects` is
 *       captured AFTER this effect's first run on the original construction
 *       (because `effect()` runs its callback synchronously on registration,
 *       even inside the surrounding `batch()`), so the snapshot already
 *       carries `roomId`. The undo cascade removed the Room with
 *       `addToHistory: false`, so it is not recreated by any command in
 *       history when the catalog drop is redone.
 *     - Explicit-delete + undo: the Item cascade in
 *       `removeNodeRecursive` likewise dispatches the dependent-room
 *       removal with `addToHistory: false`, so the Room is gone after the
 *       cascade and no `RemoveNodeCommand.undo` recreates it on undo.
 *     In both paths we treat the closet exactly as if `roomId` were null —
 *     spawn a fresh dependent Room and overwrite the stale id. The
 *     `roomId` write re-fires the effect, which then converges to Branch 2
 *     against the freshly-created Room.
 * 2.  Topology unchanged (`points.length === room.path.length`) — hot path:
 *     write each Point's `position` only when it has actually drifted
 *     beyond `POINT_EPS`. Same idempotency pattern as
 *     `ceilingMountPlanesSyncEffect` to keep drag re-renders from
 *     re-emitting work.
 * 3.  Topology changed — rebuild segments + points but keep the Room id
 *     stable (so back-references and Floor2D / Ceiling2D children remain
 *     intact). Triggered by catalog template edits that change the curve
 *     point count.
 */
const updateReachInClosetDependentRoomEffect = (node) => {
    if (node.type !== NodeType.Item || node.itemType.get() !== ItemType.reachInCloset) {
        return undefined;
    }
    if (!node.roomShape || !node.roomId)
        return undefined;
    // === Tracked dependency capture ===
    // Everything read above this comment IS a tracked dependency of the
    // effect. `computeDependentRoomPoints` reads `closet.roomShape` (formula
    // tokens auto-track closet attributes / size) and walks the closet's
    // matrix chain (parent MountLine → RoomSegment → Stage → Floorplan); all
    // of those are legitimate inputs that should re-fire the effect.
    // `node.roomId.get()` is also a legitimate input — it transitions
    // null → UUID exactly once after spawn, and the re-fire is what flips us
    // from Branch 1 to Branch 2.
    const points = computeDependentRoomPoints(node.core, node);
    const currentRoomId = node.roomId.get();
    // === Untracked work ===
    // Below this point we WRITE through commands. Two kinds of writes happen:
    // (a) explicit `set()` calls inside our commands' `execute()` bodies;
    // (b) implicit `.get()` calls those same commands make to capture
    //     `prevValue` for undo (e.g. `SetNodeVector2Command.execute` reads
    //     `point.position.x.get()` before writing it). Without `untracked`,
    //     (b) re-enrols our effect onto the very signal we're about to write
    //     in (a), which `@preact/signals-react` flags as `Error: Cycle
    //     detected`. Wrapping the whole write block in `untracked()` decouples
    //     command-internal reads from the effect's dependency set without
    //     losing the legitimate inputs captured above.
    untracked(() => {
        try {
            if (points.length < 3)
                return; // degenerate footprint — skip
            // Spawn a fresh dependent Room and link it back to the closet. Used by
            // Branch 1 (initial construction) and Branch 1b (stale-roomId
            // recovery). Both writes are addToHistory: false; the dependent room
            // is bookkeeping, never its own undo step.
            const spawnDependentRoom = () => {
                const stage = getStage(node.core, node.core.currentStage.get());
                const { roomId: newRoomId } = createDependentRoomForReachInCloset(node.core, stage.id, node.id, points);
                node.core.runCommandsAsTransaction(new SetNodeSignalCommand(node.id, 'roomId', newRoomId), '', false);
            };
            if (currentRoomId === null) {
                // Branch 1 — first run after construction.
                spawnDependentRoom();
                return;
            }
            // Resolve the existing dependent Room. A non-null `currentRoomId` may
            // be STALE — see Branch 1b in the header comment.
            let room;
            try {
                room = getNode(node.core, currentRoomId);
            }
            catch {
                // Branch 1b — stale roomId. Spawn fresh; the new roomId overwrites
                // the stale one, the effect re-fires on the change, and converges
                // to Branch 2 against the just-created Room.
                spawnDependentRoom();
                return;
            }
            if (room.type !== NodeType.Room) {
                // Defensive: roomId points to a non-Room node (data corruption).
                // Treat as stale and respawn rather than silently desyncing.
                spawnDependentRoom();
                return;
            }
            const path = room.path.get();
            if (path.length !== points.length) {
                // Branch 3 — topology change.
                rebuildDependentRoomSegments(node.core, room, points);
                return;
            }
            // Branch 2 — hot path. Write only points that drifted.
            const cmds = [];
            for (let i = 0; i < path.length; i += 1) {
                let segment;
                try {
                    segment = getRoomSegment(node.core, path[i]);
                }
                catch {
                    continue;
                }
                let point;
                try {
                    point = getPoint(node.core, segment.from.get());
                }
                catch {
                    continue;
                }
                const next = points[i];
                if (Math.abs(point.position.x.get() - next.x) > POINT_EPS ||
                    Math.abs(point.position.y.get() - next.y) > POINT_EPS) {
                    cmds.push(new SetNodeVector2Command(point.id, VectorProps.position, { x: next.x, y: next.y }));
                }
            }
            if (cmds.length > 0) {
                node.core.runCommandsAsTransaction(cmds, '', false);
            }
        }
        catch (error) {
            // Mirror the defensive `try/catch` pattern in the other layout
            // effects: a single bad iteration must not poison the registry /
            // crash the app.
            getMonitor().error('updateReachInClosetDependentRoomEffect', error instanceof Error ? error : null);
        }
    });
    return undefined;
};
registerEffects(ItemType.reachInCloset, [updateReachInClosetDependentRoomEffect]);

export { updateReachInClosetDependentRoomEffect };
