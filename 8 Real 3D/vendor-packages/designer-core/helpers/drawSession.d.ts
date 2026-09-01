import { CoreDesigner } from '../designer-core';
/**
 * Lifecycle helpers for an in-progress floorplan room-drawing gesture.
 *
 * A draw session bundles every node mutation produced between the first
 * pointer click and either (a) a successful path close or (b) any kind of
 * cancellation (toolbar exit, mode switch, Esc, component unmount) into a
 * single long-lived transaction stored on `core.drawRoomData.transaction`.
 *
 * The session is owned by `core` — not by the React component that paints
 * the cursor — so that any consumer that exits draw mode can cooperate with
 * the in-progress gesture without reaching into UI internals.
 *
 * Routing rules:
 *  - First node creation: `beginDrawSession(core)` (idempotent).
 *  - Path closed normally: `commitDrawSession(core)` BEFORE flipping the
 *    draw mode, otherwise the component unmount path will see an open
 *    transaction and abort it (rolling back the just-committed room).
 *  - Any cancel path (toolbar click, Esc, component unmount, view-mode
 *    switch): `cancelDrawSession(core)` — rolls back every node created
 *    during the gesture and clears the field.
 *  - Toolbar / shortcut wanting to leave draw mode: `exitDrawMode(core)`
 *    cancels first, then dispatches `SetFloorplanDrawModeCommand(none)` as
 *    its own root transaction (so the mode change reaches history).
 */
export declare const beginDrawSession: (core: CoreDesigner) => import("..").Transaction;
export declare const commitDrawSession: (core: CoreDesigner) => void;
export declare const cancelDrawSession: (core: CoreDesigner) => void;
/**
 * Reset the per-gesture pointer signals owned by `drawRoomData`. Called by
 * the draw-mode UI cleanup; exposed here so non-UI exit paths
 * (`exitDrawMode`) can keep `drawRoomData` consistent without depending on
 * `DrawRoomPoint` being mounted at the moment of exit.
 */
export declare const resetDrawPointer: (core: CoreDesigner) => void;
/**
 * Leaves floorplan-draw mode from any non-success exit path. Order matters:
 * the open draw transaction is cancelled FIRST so the subsequent
 * `SetFloorplanDrawModeCommand` does not nest into (and get aborted with)
 * the gesture transaction.
 */
export declare const exitDrawMode: (core: CoreDesigner) => void;
