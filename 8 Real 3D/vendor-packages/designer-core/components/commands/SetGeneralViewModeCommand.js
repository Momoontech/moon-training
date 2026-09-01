import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

class SetGeneralViewModeCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.generalViewMode, newValue);
    }
}

export { SetGeneralViewModeCommand as default };
