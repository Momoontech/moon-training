import { UUID } from '../../declarations';
import { FoldableSignalCommand } from './SetCoreSignalCommand';
export default class SetHoveredNodeIdCommand extends FoldableSignalCommand<UUID | null> {
    constructor(newValue: UUID | null);
}
