import { InterpretedVector3, UUID, VectorProps } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
export default class SetNodeVector3Command implements Command {
    nodeId: UUID;
    vector: VectorProps;
    prevValue: InterpretedVector3 | undefined;
    newValue: InterpretedVector3;
    constructor(nodeId: UUID, vector: VectorProps, newValue: InterpretedVector3);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
