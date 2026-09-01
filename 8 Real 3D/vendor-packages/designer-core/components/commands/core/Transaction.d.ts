import { Command } from './Command';
import { TransactionManager } from './TransactionManager';
export default class Transaction {
    transactionManager: TransactionManager;
    parent: Transaction | null;
    pendingChildren: Transaction[];
    key: string;
    commands: Command[];
    undoneCommands: Command[];
    pending: boolean;
    aborted: boolean;
    addToHistory: boolean;
    constructor(key: string, transactionManager: TransactionManager, addToHistory?: boolean);
    isAborted(): boolean;
    recordCommand(newCommand: Command): void;
    private safeExecute;
    private safeUndo;
    tryUndo(): boolean;
    redo(): void;
    /** Ends the transaction and commits it if it is not aborted. */
    end(): void;
    /**
     Marks the transaction as aborted, unrolls any commands thus far, and prevents recording additional commands.
     *
     * **Note**: aborting a transaction does not end it, as child transactions may still be used in async code. Transaction must be ended as normal when children are done.
     */
    abort(): void;
    root(): Transaction;
    toString(): string;
}
