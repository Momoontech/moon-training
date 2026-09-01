import { UUID } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetSelectedNodeIdCommand extends FoldableSignalCommand<UUID | null> {
    constructor(newValue: UUID | null);
}
