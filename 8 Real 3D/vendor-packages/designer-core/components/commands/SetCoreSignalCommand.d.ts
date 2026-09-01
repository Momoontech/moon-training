import { CoreDesigner } from '../../designer-core';
import { Command, HistoryBehavior } from './core/Command';
type Signal<T> = {
    get(): T;
    peek(): T;
    set(v: T): void;
};
export default class SetCoreSignalCommand<T> implements Command {
    private readonly getSignal;
    private readonly newValue;
    private readonly options?;
    private _prevValue;
    private _executed;
    constructor(getSignal: (core: CoreDesigner) => Signal<T>, newValue: T, options?: {
        usePeek?: boolean;
        onExecute?: (core: CoreDesigner) => void;
    } | undefined);
    execute(core: CoreDesigner): boolean;
    undo(core: CoreDesigner): boolean;
}
/**
 * Base for single-signal commands that fold into the previous edit instead of being
 * their own undo step. Extend this (not {@link SetCoreSignalCommand}) to opt into folding.
 */
export declare abstract class FoldableSignalCommand<T> extends SetCoreSignalCommand<T> {
    /** Classifies this command as fold-only. @see {@link HistoryBehavior.Fold} */
    readonly historyBehavior = HistoryBehavior.Fold;
}
export {};
