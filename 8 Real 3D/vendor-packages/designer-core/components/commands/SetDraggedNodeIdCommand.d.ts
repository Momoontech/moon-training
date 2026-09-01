import { UUID } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetDraggedNodeIdCommand extends FoldableSignalCommand<UUID | null> {
    constructor(newValue: UUID | null);
}
