import { CoreDesigner } from '../../designer-core';
import { IValue, UUID, VAxes, VectorProps } from '../../declarations';
import { Command } from './core/Command';
export default class SetNodeVectorComponentCommand implements Command {
    nodeId: UUID;
    axe: VAxes;
    vector: VectorProps;
    prevValue: IValue<number> | undefined;
    newValue: IValue<number>;
    constructor(nodeId: UUID, vector: VectorProps, axis: VAxes, newValue: IValue<number>);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
