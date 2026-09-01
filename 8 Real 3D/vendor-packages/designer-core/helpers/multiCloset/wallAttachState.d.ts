import { UUID } from '../../declarations';
/**
 * The wall edge the last SUCCESSFUL planar drag frame snapped the dragged item's back
 * flush against, witnessed by `dragOnMountPlane` and consumed once at drop by
 * {@link buildMultiClosetWallMountCommands}.
 *
 * Module state for the single in-flight drag, mirroring `dragOnItem` /
 * `dragOnFreeBoxContainer` in `designer3d`. It lives in `designer-core` rather than
 * next to those two because BOTH the canvas drop (`designer3d`'s `Handler.pointerup`)
 * and the floorplan-overlay drop (`designer-ui`'s `Item.tsx`) have to read it, and
 * `designer-ui` cannot import `designer3d`.
 *
 * Deliberately stores the RAW mount-local edge, never a node id: `evaluateWallZone`
 * reports polygon edges of the floor mount shape, and resolving one to a
 * `RoomSegment` / `Wall2D` / `MountLine` means walking `room.path` with a `getPoint`
 * per endpoint. That is drop-time work — a value only the drop consumes must not be
 * recomputed on every `pointermove` against the 120 Hz frame budget. Nothing in this
 * module touches the node graph.
 */
export type WallAttachRecord = {
    /** The dragged node the record belongs to. */
    nodeId: UUID;
    /** The planar `MountPlane` the frame was dragging on — the frame the edge is expressed in. */
    mountPlaneId: UUID;
    /** Winning edge start vertex, mount-local 2D (`Shape.getPoints(0)` space). */
    segStartX: number;
    segStartY: number;
    /** Winning edge unit direction, mount-local 2D. */
    segDirX: number;
    segDirY: number;
};
/**
 * Remember that `nodeId`, dragging on `mountPlaneId`, is flush against the edge
 * described by `segStart` / `segDir`. Called once per successful planar frame.
 */
export declare const recordWallAttach: (nodeId: UUID, mountPlaneId: UUID, segStart: {
    x: number;
    y: number;
}, segDir: {
    x: number;
    y: number;
}) => void;
/**
 * Forget the last wall. Called by every planar frame that did NOT end flush against a
 * wall — including frames that rolled back — and by the drag-teardown paths
 * (`Handler.pointerup`, `Handler.abortPendingGesture`, `Item.tsx`'s pointer-up / abort).
 *
 * Clearing on every non-flush frame is what makes "the last frame said flush"
 * trustworthy at drop with no geometric re-check: snap to a wall, then drag away, and
 * the record is gone before pointer-up.
 */
export declare const clearWallAttach: () => void;
/** The live record, or `null` when the last planar frame did not end flush against a wall. */
export declare const getWallAttach: () => WallAttachRecord | null;
