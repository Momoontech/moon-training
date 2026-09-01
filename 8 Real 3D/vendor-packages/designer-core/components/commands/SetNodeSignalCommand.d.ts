import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
export default class SetNodeSignalCommand<T> implements Command {
    private nodeId;
    private propertyName;
    private propertyValue;
    private prevValue;
    constructor(nodeId: UUID, propertyName: string, propertyValue: T);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
