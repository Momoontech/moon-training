import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

/**
 * Sets the project-wide edit-direction convention used by every dimension /
 * angle badge overlay (FloorPlanUI, Editor2DUI, Editor3DUI). Persists with
 * the rest of `RoomSettings` so a user's preferred direction survives reloads
 * of the same project.
 *
 * Mirrors `SetCornerOrthoSnapCommand` — both target a sibling field on
 * `core.projectSettings.roomSettings`. Undo restores the previous direction
 * captured at execute time.
 *
 * Per-overlay code may still derive an **effective** direction by combining
 * this global signal with local conditions (e.g. inverting CW to CCW for a
 * specific wall when the upcoming lock feature blocks the global side). The
 * combination happens in the consumer, not in this command — toggling always
 * writes the global signal, never a per-wall override.
 */
class SetEditingDirectionCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.projectSettings.roomSettings.editingDirection, newValue);
    }
}

export { SetEditingDirectionCommand as default };
