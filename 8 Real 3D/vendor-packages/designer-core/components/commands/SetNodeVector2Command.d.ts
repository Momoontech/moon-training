import { UUID, VectorProps } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
import { Command } from './core/Command';
export default class SetNodeVector2Command implements Command {
    nodeId: UUID;
    vector: VectorProps;
    prevValue: {
        x: number;
        y: number;
    } | undefined;
    newValue: {
        x: number;
        y: number;
    };
    constructor(nodeId: UUID, vector: VectorProps, newValue: {
        x: number;
        y: number;
    });
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
