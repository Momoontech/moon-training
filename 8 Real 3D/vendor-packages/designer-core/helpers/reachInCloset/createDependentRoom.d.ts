import { Room } from '../../components/Node/components/Room';
import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Vector2 } from '../math/Vector2';
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
export declare const createDependentRoomForReachInCloset: (core: CoreDesigner, stageId: UUID, closetId: UUID, points: Vector2[]) => {
    roomId: UUID;
    segmentIds: UUID[];
    pointIds: UUID[];
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
export declare const rebuildDependentRoomSegments: (core: CoreDesigner, room: Room, points: Vector2[]) => void;
