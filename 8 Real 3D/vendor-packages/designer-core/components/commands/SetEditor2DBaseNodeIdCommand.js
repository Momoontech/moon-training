import { FoldableSignalCommand } from './SetCoreSignalCommand.js';

class SetEditor2DBaseNodeIdCommand extends FoldableSignalCommand {
    constructor(nodeId) {
        super((core) => core.editor2DBaseNodeId, nodeId);
    }
}

export { SetEditor2DBaseNodeIdCommand as default };
