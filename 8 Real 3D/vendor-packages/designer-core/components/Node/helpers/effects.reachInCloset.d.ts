import { NodeEffect } from '../../../designer-core';
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
export declare const updateReachInClosetDependentRoomEffect: NodeEffect;
