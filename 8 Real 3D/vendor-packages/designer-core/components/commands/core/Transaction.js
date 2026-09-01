import { getMonitor } from '../../../helpers/monitor.js';

/// A transaction represents a cohesive user-visible operation.
class Transaction {
    transactionManager;
    parent = null;
    pendingChildren = [];
    key;
    commands = [];
    undoneCommands = [];
    pending = true;
    aborted = false;
    addToHistory = true;
    constructor(key, transactionManager, addToHistory = true) {
        this.key = key;
        this.transactionManager = transactionManager;
        this.addToHistory = addToHistory;
    }
    isAborted() {
        return this.aborted;
    }
    recordCommand(newCommand) {
        this.commands.push(newCommand);
    }
    safeExecute(command) {
        let success = false;
        let error = null;
        try {
            success = command.execute(this.transactionManager.core);
        }
        catch (e) {
            success = false;
            error = e instanceof Error ? e : null;
        }
        if (!success) {
            getMonitor().error(`🔥 Failed to redo ${command.constructor.name}`, error);
        }
        return success;
    }
    safeUndo(command) {
        if (!command.undo) {
            getMonitor().warn(`⚠️ Command ${command.constructor.name} is not undoable, and will block undoing of earlier commands`);
            return false;
        }
        let success = false;
        let error = null;
        try {
            success = command.undo(this.transactionManager.core);
        }
        catch (e) {
            success = false;
            error = e instanceof Error ? e : null;
        }
        if (!success) {
            getMonitor().error(`🔥 Failed to undo ${command.constructor.name}`, error);
        }
        return success;
    }
    tryUndo() {
        while (this.commands.length > 0) {
            const command = this.commands[this.commands.length - 1];
            // assertNotUndefined(command, 'Command is undefined');
            if (!this.safeUndo(command)) {
                getMonitor().error('🔥 Failed to undo existing command - skipping');
                // Remove from command chain to prevent redoing a non-undone command
                this.commands.pop();
                continue;
            }
            this.undoneCommands.push(command);
            this.commands.pop();
        }
        return true;
    }
    redo() {
        while (this.undoneCommands.length > 0) {
            const command = this.undoneCommands[this.undoneCommands.length - 1];
            // assertNotUndefined(command, 'Command is undefined');
            if (!this.safeExecute(command)) {
                getMonitor().error('🔥 Failed to redo existing command - skipping');
                // Remove from command chain to prevent undoing the command that was not redone
                this.undoneCommands.pop();
                continue;
            }
            this.undoneCommands.pop();
            this.commands.push(command);
        }
    }
    /** Ends the transaction and commits it if it is not aborted. */
    end() {
        this.transactionManager.endTransaction(this);
    }
    /**
     Marks the transaction as aborted, unrolls any commands thus far, and prevents recording additional commands.
     *
     * **Note**: aborting a transaction does not end it, as child transactions may still be used in async code. Transaction must be ended as normal when children are done.
     */
    abort() {
        this.transactionManager.abortTransaction(this);
    }
    root() {
        let current = this;
        while (current.parent != null) {
            current = current.parent;
        }
        return current;
    }
    toString() {
        return `Transaction(${this.key}, commands: ${this.commands.map((c) => c.constructor.name).join(', ')})`;
    }
}

export { Transaction as default };
