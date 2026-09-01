import type { IObjects } from '../../declarations/appData';
import type { UUID } from '../../declarations/core';
import type { CoreDesigner } from '../../designer-core';
import { type TestCoreOpts } from './createMockCore';
export declare const FP_POINT_IDS: UUID[];
export declare const FP_SEGMENT_IDS: UUID[];
export declare const FP_WALL2D_IDS: UUID[];
export declare const FP_WALL_MOUNT_PLANE_IDS: UUID[];
export declare const FP_WALL_MOUNT_LINE_IDS: UUID[];
export declare const FP_ROOM_ID: UUID;
export declare const FP_FLOOR2D_ID: UUID;
export declare const FP_CEILING2D_ID: UUID;
export declare const FP_FLOOR_MOUNT_PLANE_ID: UUID;
export declare const FP_CEILING_MOUNT_PLANE_ID: UUID;
/** A `base` multiCloset on the floor MountPlane — the subject of the wall-mount tests. */
export declare const FP_CLOSET_ID: UUID;
/**
 * A `Wall2D` whose `parent` references a node that does not exist — the fallback branch
 * of `getSelectableNode`'s Wall2D fold (a wall left dangling by a torn-down subtree
 * resolves to ITSELF, not to `undefined`). Seeded by {@link seedDegenerateWallNodes}.
 */
export declare const FP_ORPHAN_WALL2D_ID: UUID;
/**
 * A linear `RoomSegment` with `wall2D: null` — the shape an arc / bezier segment has (no
 * helper builds walls for those yet). Stands in for "a selected segment with no wall
 * counterpart in the upright views". Seeded by {@link seedDegenerateWallNodes}.
 */
export declare const FP_WALL_LESS_SEGMENT_ID: UUID;
/** Corner coordinates (inches) of the rectangular room, in RAW point space. */
export declare const FP_POINT_POSITIONS: {
    x: number;
    y: number;
}[];
export declare const FP_CLOSET_SIZE: {
    x: number;
    y: number;
    z: number;
};
export declare const buildFloorplanObjects: () => IObjects;
/**
 * A `CoreDesigner` whose current Stage holds the rectangular-room graph above.
 *
 * `opts` is merged over the fixture's own `appData` / `nodes` slots, so a caller can
 * add the other `createMockCore` overrides on top — e.g. `{ coreMode: CoreMode.mobile,
 * projectSettings }` to exercise a per-step rule (which selectable types a mobile step
 * allows) against the same room. Passing `appData` / `nodes` would replace the fixture
 * graph, which defeats the purpose; don't.
 */
export declare const createFloorplanCore: (opts?: TestCoreOpts) => CoreDesigner;
/**
 * Add the two DEGENERATE wall shapes to a core built by {@link createFloorplanCore}:
 * an orphaned `Wall2D` (`FP_ORPHAN_WALL2D_ID`) and a wall-less `RoomSegment`
 * (`FP_WALL_LESS_SEGMENT_ID`).
 *
 * They live here rather than in `buildFloorplanObjects` because that map is walked
 * from the Floorplan root through container properties: a node no container references
 * is never instantiated, and referencing these two from `stage.segments` / a `Room.path`
 * would put a broken wall inside the room every other consumer relies on. So they are
 * created directly (`createNode`, bypassing the command pipeline like
 * `restoreMockItemSeeds`) and stay OUTSIDE the stage collections — fine for the
 * selection helpers, which only walk `parent` / `wall2D`.
 *
 * Idempotent — safe to call from `beforeAll` and again from `beforeEach`.
 */
export declare const seedDegenerateWallNodes: (core: CoreDesigner) => void;
