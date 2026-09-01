import { UUID } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetEditor2DBaseNodeIdCommand extends FoldableSignalCommand<UUID | null> {
    constructor(nodeId: UUID | null);
}
