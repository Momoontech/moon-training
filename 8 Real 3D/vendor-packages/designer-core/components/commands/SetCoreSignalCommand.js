import { HistoryBehavior } from './core/Command.js';

class SetCoreSignalCommand {
    getSignal;
    newValue;
    options;
    _prevValue;
    _executed = false;
    constructor(getSignal, newValue, options) {
        this.getSignal = getSignal;
        this.newValue = newValue;
        this.options = options;
    }
    execute(core) {
        const signal = this.getSignal(core);
        this._prevValue = this.options?.usePeek ? signal.peek() : signal.get();
        this._executed = true;
        signal.set(this.newValue);
        this.options?.onExecute?.(core);
        return true;
    }
    undo(core) {
        if (!this._executed)
            return false;
        this.getSignal(core).set(this._prevValue);
        return true;
    }
}
/**
 * Base for single-signal commands that fold into the previous edit instead of being
 * their own undo step. Extend this (not {@link SetCoreSignalCommand}) to opt into folding.
 */
class FoldableSignalCommand extends SetCoreSignalCommand {
    /** Classifies this command as fold-only. @see {@link HistoryBehavior.Fold} */
    historyBehavior = HistoryBehavior.Fold;
}

export { FoldableSignalCommand, SetCoreSignalCommand as default };
