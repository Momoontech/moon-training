import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

class SetSelectedSystemIdCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.selectedSystemId, newValue, { usePeek: true });
    }
}

export { SetSelectedSystemIdCommand as default };
