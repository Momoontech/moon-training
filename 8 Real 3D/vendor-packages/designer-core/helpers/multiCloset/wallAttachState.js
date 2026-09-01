/** Preallocated — `recordWallAttach` mutates this in place, so the frame path never allocates. */
const record = {
    nodeId: '',
    mountPlaneId: '',
    segStartX: 0,
    segStartY: 0,
    segDirX: 0,
    segDirY: 0
};
let hasRecord = false;
/**
 * Remember that `nodeId`, dragging on `mountPlaneId`, is flush against the edge
 * described by `segStart` / `segDir`. Called once per successful planar frame.
 */
const recordWallAttach = (nodeId, mountPlaneId, segStart, segDir) => {
    record.nodeId = nodeId;
    record.mountPlaneId = mountPlaneId;
    record.segStartX = segStart.x;
    record.segStartY = segStart.y;
    record.segDirX = segDir.x;
    record.segDirY = segDir.y;
    hasRecord = true;
};
/**
 * Forget the last wall. Called by every planar frame that did NOT end flush against a
 * wall — including frames that rolled back — and by the drag-teardown paths
 * (`Handler.pointerup`, `Handler.abortPendingGesture`, `Item.tsx`'s pointer-up / abort).
 *
 * Clearing on every non-flush frame is what makes "the last frame said flush"
 * trustworthy at drop with no geometric re-check: snap to a wall, then drag away, and
 * the record is gone before pointer-up.
 */
const clearWallAttach = () => {
    hasRecord = false;
};
/** The live record, or `null` when the last planar frame did not end flush against a wall. */
const getWallAttach = () => (hasRecord ? record : null);

export { clearWallAttach, getWallAttach, recordWallAttach };
