import SetFloorplanDrawModeCommand from '../components/commands/SetFloorplanDrawModeCommand.js';
import '../declarations/Attributes.js';
import '../declarations/BoxContainer.js';
import { FloorPlanDrawMode } from '../declarations/CoreDesigner.js';
import '../declarations/Edgebanding.js';
import '../declarations/FreeBoxContainer.js';
import '../declarations/helpers.js';
import { V2Axes } from '../declarations/InterpretedLine.js';
import '../declarations/Loader.js';
import '../declarations/Model.js';
import '../declarations/Molding.js';
import '../declarations/Node.js';
import '../declarations/Panel.js';
import '../declarations/PaperSpace.js';
import '../declarations/Part.js';
import '../declarations/ProjectSettings.js';
import '../declarations/Segment.js';
import '../declarations/SurfaceSettings.js';
import '../declarations/systems.js';
import '../declarations/UIAttributes.js';
import '../declarations/Valance.js';
import '../declarations/views.js';

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
const beginDrawSession = (core) => {
    if (core.drawRoomData.transaction)
        return core.drawRoomData.transaction;
    const transaction = core.beginTransaction('Draw room polygon');
    core.drawRoomData.transaction = transaction;
    return transaction;
};
const commitDrawSession = (core) => {
    const transaction = core.drawRoomData.transaction;
    if (!transaction)
        return;
    core.drawRoomData.transaction = null;
    transaction.end();
};
const cancelDrawSession = (core) => {
    const transaction = core.drawRoomData.transaction;
    if (!transaction)
        return;
    core.drawRoomData.transaction = null;
    transaction.abort();
    transaction.end();
};
/**
 * Reset the per-gesture pointer signals owned by `drawRoomData`. Called by
 * the draw-mode UI cleanup; exposed here so non-UI exit paths
 * (`exitDrawMode`) can keep `drawRoomData` consistent without depending on
 * `DrawRoomPoint` being mounted at the moment of exit.
 */
const resetDrawPointer = (core) => {
    core.drawRoomData.prevPointer.set(null);
    core.drawRoomData.pointer[V2Axes.x].set(0);
    core.drawRoomData.pointer[V2Axes.y].set(0);
};
/**
 * Leaves floorplan-draw mode from any non-success exit path. Order matters:
 * the open draw transaction is cancelled FIRST so the subsequent
 * `SetFloorplanDrawModeCommand` does not nest into (and get aborted with)
 * the gesture transaction.
 */
const exitDrawMode = (core) => {
    cancelDrawSession(core);
    resetDrawPointer(core);
    if (core.floorPlanDrawMode.get() !== FloorPlanDrawMode.none) {
        core.runCommandsAsTransaction(new SetFloorplanDrawModeCommand(FloorPlanDrawMode.none));
    }
};

export { beginDrawSession, cancelDrawSession, commitDrawSession, exitDrawMode, resetDrawPointer };
