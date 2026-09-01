import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

class SetCornerOrthoSnapCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.projectSettings.roomSettings.snap.corner.ortho, newValue);
    }
}

export { SetCornerOrthoSnapCommand as default };
