import { CoreDesigner } from '../../designer-core';
import { UUID } from '../../declarations';
import { Command, HistoryBehavior } from './core/Command';
/**
 * Command to set the selected PaperSpace view (page). Used for undo/redo when
 * switching views from the ViewSelector or other UI.
 */
export default class SetSelectedPageCommand implements Command {
    /** Fold-only; implements `Command` directly as it sets two signals. @see {@link HistoryBehavior.Fold} */
    readonly historyBehavior = HistoryBehavior.Fold;
    prevValue: UUID | undefined;
    private prevViewID;
    newValue: UUID;
    constructor(newValue: UUID);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
