import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

class SetSelectedNodeIdCommand extends FoldableSignalCommand {
    constructor(newValue) {
        super((core) => core.selectedNodeId, newValue, { usePeek: true });
    }
}

export { SetSelectedNodeIdCommand as default };
