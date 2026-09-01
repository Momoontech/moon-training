import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

// Transient gesture state, not persisted scene data: extends FoldableSignalCommand so it
// does not advance `sceneRevision` (which would trigger a save of an unchanged scene). All
// dispatch sites use `addToHistory=false`, so the fold routing itself is never reached.
class SetDraggedCatalogPathCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.draggedCatalogPath, newValue);
    }
}

export { SetDraggedCatalogPathCommand as default };
