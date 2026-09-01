import { IValue } from '../../declarations';
import Value from '../Value';
import { Command } from './core/Command';
export default class SetValueCommand<T> implements Command {
    prevValue: IValue<T> | null;
    private hasPrevSnapshot;
    variableValue: Value<T>;
    updatedValue: IValue<T>;
    constructor(variableValue: Value<T>, updatedValue: IValue<T>);
    execute(): boolean;
    undo(): boolean;
}
