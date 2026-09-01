import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

class SetSnapSensitivityCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.projectSettings.snapSensitivity, newValue);
    }
}

export { SetSnapSensitivityCommand as default };
