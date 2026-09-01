import { HistoryBehavior } from './core/Command.js';

/**
 * Command to set the selected PaperSpace view (page). Used for undo/redo when
 * switching views from the ViewSelector or other UI.
 */
class SetSelectedPageCommand {
    /** Fold-only; implements `Command` directly as it sets two signals. @see {@link HistoryBehavior.Fold} */
    historyBehavior = HistoryBehavior.Fold;
    prevValue = undefined;
    prevViewID = undefined;
    newValue;
    constructor(newValue) {
        this.newValue = newValue;
    }
    execute(core) {
        if (!core.paperSpace)
            return false;
        this.prevValue = core.paperSpace.selectedPageID.get();
        this.prevViewID = core.paperSpace.selectedViewID.get();
        core.paperSpace.selectedPageID.set(this.newValue);
        const viewID = core.paperSpace.getViewIDByPageID(this.newValue);
        if (viewID) {
            core.paperSpace.selectedViewID.set(viewID);
        }
        return true;
    }
    undo(core) {
        if (!core.paperSpace || this.prevValue === undefined)
            return false;
        core.paperSpace.selectedPageID.set(this.prevValue);
        if (this.prevViewID !== undefined) {
            core.paperSpace.selectedViewID.set(this.prevViewID);
        }
        return true;
    }
}

export { SetSelectedPageCommand as default };
