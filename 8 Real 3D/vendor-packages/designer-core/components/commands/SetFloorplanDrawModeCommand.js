import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

class SetFloorplanDrawModeCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.floorPlanDrawMode, newValue);
    }
}

export { SetFloorplanDrawModeCommand as default };
