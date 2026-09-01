import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

// Hover means mountable object, we currently drag "draggedObject" on top of it
// It's used to highlight the mountable object and here when it changes
// we need to update draggedNode offset
//
// Transient gesture state, not persisted scene data: extends FoldableSignalCommand so it
// does not advance `sceneRevision` (which would trigger a save of an unchanged scene). All
// dispatch sites use `addToHistory=false`, so the fold routing itself is never reached.
class SetHoveredNodeIdCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.hoveredNodeId, newValue);
    }
}

export { SetHoveredNodeIdCommand as default };
