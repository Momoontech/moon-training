import { signal, batch } from '@preact/signals-react';
import { getMonitor } from '../../../helpers/monitor.js';
import { HistoryBehavior } from './Command.js';
import Transaction from './Transaction.js';

/// Maximum number of pending (open) transactions allowed.
const transactionRecursionLimit = 1000;
/// Number of pending transactions until a warning is issued.
///
/// This is to help catch runaway recursive transactions or transactions that are not disposed properly and forgotten.
const transactionRecursionWarnThreshold = 50;
/**
 * Manages undo and transactional command history.
 *
 * Each cohesive operation (group of commands) is represented by a transaction.
 *
 * A transaction may contain nested transactions.
 *
 * When a transaction is committed, it is added to the history.
 * Undoing will undo the entire transaction, including all nested transactions.
 *
 * **Note**: A transaction may not close while child transactions are still pending. This is to allow opening child transactions in unaware systems if someone in a previous loop fails the transaction.
 * Ideally, the called should short circuit, but may not always be aware of the transaction.
 */
class TransactionManager {
    core;
    maxHistoryLength = 1000;
    history = [];
    redoHistory = [];
    /** Fold commands committed while history was empty; prepended onto the next edit. */
    foldBuffer = [];
    // Stack of open transactions
    pendingTransactions = [];
    canUndo = signal(false);
    canRedo = signal(false);
    /**
     * Monotonic counter bumped once per applied scene mutation — every committed
     * edit pack (history and non-history) plus each undo / redo. Consumers read it
     * inside a tracked scope (e.g. `core.registerEffect`) as a "the scene changed"
     * trigger; the absolute value is meaningless, only that it advanced. Unlike
     * `canUndo`, it fires on *every* edit, not just the empty↔non-empty history
     * boundary, and it deliberately does NOT fire for fold-only operations
     * (selection / hover / view-mode) which do not mutate persisted scene data.
     */
    sceneRevision = signal(0);
    /**
     * Epoch milliseconds (`Date.now()`) of the last applied scene mutation — written
     * by the same `markSceneMutated` call that advances `sceneRevision`, so the two
     * always move together. `0` until the first mutation runs through this manager —
     * note that loading a scene can itself apply commands (e.g. the RoomPlan import),
     * so a non-zero stamp right after construction is expected. It is a comparison
     * point against your own last-save marker, not an "unsaved changes" flag.
     *
     * This is the human-facing timestamp ("saved 2 min ago", "changed at 14:03") and
     * the coarse "is the scene newer than the last save?" comparison. For the actual
     * dirty check prefer `sceneRevision`: two edits inside the same millisecond share
     * a timestamp, and the wall clock can jump backwards (NTP / manual change), while
     * the counter is strictly monotonic per core instance.
     */
    lastUpdateAt = signal(0);
    /**
     * `true` while any transaction is open (`pendingTransactions` non-empty) — i.e.
     * a drag / draw / multi-command gesture is mid-flight. Drag handlers and the
     * draw session open a long-lived transaction on pointerdown and close it on
     * pointerup, so this stays `true` for the whole gesture (short atomic packs
     * open and close within a single `batch()`, so a tracked consumer only ever
     * observes the settled value). Its `true → false` edge marks "operation
     * finished" — the moment a deferred autosave should flush.
     */
    isOperationInProgress = signal(false);
    constructor(core) {
        this.core = core;
        window.undoHistory = this.history;
        window.redoHistory = this.redoHistory;
    }
    // Begins a new transaction and places it at the top of the pending stack
    beginTransaction(key, addToHistory = true) {
        if (this.pendingTransactions.length >= transactionRecursionLimit) {
            throw new Error('Max pending transactions reached. This may indicate a recursive call\n\n' +
                this.pendingTransactions
                    .slice(0, 10)
                    .map((t) => t.key)
                    .join('\n'));
        }
        else if (this.pendingTransactions.length >= transactionRecursionWarnThreshold) {
            getMonitor().warn(`⚠️ Warning: High number of pending transactions (${this.pendingTransactions.length}). This may indicate a recursive call.` +
                this.pendingTransactions
                    .slice(0, 10)
                    .map((t) => t.key)
                    .join('\n'));
        }
        const transaction = new Transaction(key, this, addToHistory);
        if (this.pendingTransactions.length > 0) {
            const parent = this.pendingTransactions[this.pendingTransactions.length - 1];
            transaction.parent = parent;
            transaction.aborted = parent.aborted;
            parent.pendingChildren.push(transaction);
        }
        this.pendingTransactions.push(transaction);
        this.syncOperationInProgress();
        return transaction;
    }
    // Ends a transaction and commits it to the history.
    endTransaction(transaction) {
        // assertTrue(transaction.pending, 'Transaction is not pending');
        // Fast-path: already removed from pendingTransactions by abortChildTransactions.
        // This happens when abort() + end() are called in sequence — abort removes the
        // transaction so that its tryUndo() calls can run without a pending parent
        // blocking child transactions. end() is still called for API completeness.
        if (!transaction.pending) {
            return;
        }
        if (this.pendingTransactions.length === 0) {
            throw new Error('No transaction to end');
        }
        // find and remove
        const index = this.pendingTransactions.findLastIndex((t) => t === transaction);
        if (index === -1) {
            throw new Error(`Transaction not found or already closed: ${transaction.key}`);
        }
        this.pendingTransactions.splice(index, 1);
        transaction.pending = false;
        this.syncOperationInProgress();
        if (transaction.aborted) {
            return;
        }
        // If the transaction has a parent (I.e; is nested) we do not commit it to the history, but add it into the parent
        if (transaction.parent) {
            // assertTrue(
            //   transaction.parent.pending,
            //   `Parent transaction ${transaction.parent.key} is closed before child transaction ${transaction.key} completed`
            // );
            // Remove from parent's pending children
            transaction.parent.pendingChildren.splice(transaction.parent.pendingChildren.indexOf(transaction), 1);
            if (transaction.addToHistory) {
                for (const command of transaction.commands) {
                    transaction.parent.recordCommand(command);
                }
            }
        }
        else {
            // Add root transactions to the history
            if (transaction.pendingChildren.length > 0) {
                getMonitor().error('Can not commit a transaction with pending children', null, {
                    pendingChildren: transaction.pendingChildren.map((c) => c.key)
                });
                return;
            }
            if (transaction.addToHistory) {
                const behavior = this.classifyTransaction(transaction);
                switch (behavior) {
                    case HistoryBehavior.Fold:
                        this.foldTransaction(transaction);
                        break;
                    case HistoryBehavior.Edit:
                        this.commitEditTransaction(transaction);
                        break;
                    default: {
                        // Exhaustiveness guard: adding a HistoryBehavior member is a compile error
                        // here until it is given an explicit commit strategy above.
                        const unreachable = behavior;
                        throw new Error(`Unhandled history behavior: ${String(unreachable)}`);
                    }
                }
            }
        }
    }
    /** {@link HistoryBehavior.Fold} only if non-empty and every command folds; else {@link HistoryBehavior.Edit}. */
    classifyTransaction(transaction) {
        const isFoldOnly = transaction.commands.length > 0 &&
            transaction.commands.every((command) => (command.historyBehavior ?? HistoryBehavior.Edit) === HistoryBehavior.Fold);
        return isFoldOnly ? HistoryBehavior.Fold : HistoryBehavior.Edit;
    }
    /**
     * Appends a fold-only transaction onto the current undo target (no new step). A fold is
     * still a *new operation*, so — like an edit — it discards the redo branch: once the user
     * acts again after an undo, the future they could have redone no longer applies. With no
     * clean anchor (empty history / partially-undone tail), buffers instead.
     */
    foldTransaction(transaction) {
        this.discardRedoHistory();
        const anchor = this.history[this.history.length - 1];
        // `undoneCommands.length === 0` rejects a *partially-undone* tail. No current flow
        // leaves such a transaction at the top of `history` (`undo()` moves the whole
        // transaction to `redoHistory`; `redo()` fully drains `undoneCommands` before pushing
        // back), so today only the empty-history `!anchor` case reaches the `else`. The
        // condition mirrors the sibling guard in `redo()` (its `undoneCommands.length > 0`
        // branch) and is the seam a future step-by-step partial undo would use — a
        // partially-undone tail would then buffer rather than corrupt the anchor. Not dead code.
        if (anchor && anchor.undoneCommands.length === 0) {
            for (const command of transaction.commands) {
                anchor.recordCommand(command);
            }
        }
        else {
            // No clean anchor (empty history today; a partially-undone tail in future): buffer
            // and prepend onto the next editable transaction so the change stays reversible.
            for (const command of transaction.commands) {
                this.foldBuffer.push(command);
            }
        }
    }
    /** Commits a real edit as a new step; flushes any buffered folds to the FRONT first (for LIFO undo). */
    commitEditTransaction(transaction) {
        if (this.foldBuffer.length > 0) {
            transaction.commands.unshift(...this.foldBuffer);
            this.foldBuffer.length = 0;
        }
        this.discardRedoHistory();
        this.pushTransactionToHistory(transaction);
    }
    /// Aborts a pending transaction, and undoes any applied commands.
    abortTransaction(transaction) {
        // Attempt to find the transaction in the pending stack. If it is not present, the parent or another child may have already aborted it
        const index = this.pendingTransactions.findLastIndex((t) => t === transaction);
        if (index === -1) {
            return;
        }
        if (transaction.parent) {
            this.abortTransaction(transaction.parent);
            // Only unwind from the root transaction
            return;
        }
        // assertTrue(transaction.pending, 'Transaction is not pending');
        this.abortChildTransactions(transaction);
    }
    runCommandsAsTransaction(commands, transactionName = '', addToHistory = true) {
        const commandList = Array.isArray(commands) ? commands : [commands];
        return this.packExecute(commandList, transactionName, addToHistory);
    }
    packExecute(commands, transactionName, addToHistory) {
        // Wrap the full pack in `batch()` so that every signal write performed by the
        // commands (and any nested `runCommandsAsTransaction` calls on the same stack)
        // is coalesced into a single effect flush when this synchronous region exits.
        // Nested packs open nested batches which Preact collapses into the outermost,
        // so subtree construction / undo / redo all render exactly once per user tick.
        // `Transaction` lifetime is intentionally NOT tied to batch lifetime — a long-
        // lived transaction (e.g. a drag session spanning pointerdown → pointerup)
        // still flushes between ticks because each pointermove calls `packExecute`
        // afresh and its batch closes when the handler returns.
        return batch(() => {
            const transaction = this.beginTransaction(transactionName || `[${commands.map((c) => c.constructor.name).join(',')}]`, addToHistory);
            // `transaction.end()` MUST run whether the loop completes, aborts, or a
            // command throws — otherwise the transaction leaks on `pendingTransactions`
            // and eventually exhausts the recursion limit (one slot per throw, forever).
            try {
                // It may be that a command pack is started on a transaction that is already aborted, for example if the caller is a loop which does not check and short circuit. Simply bounce any attempt to execute commands
                if (transaction.isAborted()) {
                    getMonitor().warn(`🔥 Skipping ${commands.map((c) => c.constructor.name).join(',')} because transaction ${transaction.root().key} is already aborted`);
                    return false;
                }
                for (let i = 0; i < commands.length; i++) {
                    const command = commands[i];
                    //@TODO: here we can record command "before execute" if required
                    // transaction.recordCommand(command);
                    let success = null;
                    let error = null;
                    try {
                        success = command.execute(this.core);
                    }
                    catch (e) {
                        success = false;
                        error = e instanceof Error ? e : null;
                    }
                    // Record unconditionally so abort() → tryUndo() can best-effort unwind
                    // any partial mutations the command made before failing or throwing.
                    transaction.recordCommand(command);
                    if (!success) {
                        getMonitor().error(`🔥 Error executing command ${command.constructor.name}`, error);
                        // Abort before rethrowing so the `finally` block's `transaction.end()`
                        // rolls back applied commands instead of committing them to history.
                        transaction.abort();
                        if (error) {
                            throw error;
                        }
                        break;
                    }
                    if (transaction.isAborted()) {
                        break;
                    }
                }
                // can be aborted by a nested transaction
                if (transaction.isAborted()) {
                    return false;
                }
                // Signal a scene mutation for change-driven consumers (e.g. autosave). Only a
                // genuine edit advances the revision — a fold-only pack (selection / hover /
                // view-mode) mutates no persisted scene data and must not trigger a save. The
                // write is inside `batch()`, so nested packs coalesce into one effect flush.
                if (transaction.commands.some((c) => (c.historyBehavior ?? HistoryBehavior.Edit) === HistoryBehavior.Edit)) {
                    this.markSceneMutated();
                }
                return true;
            }
            finally {
                transaction.end();
            }
        });
    }
    abortChildTransactions(transaction) {
        // NOTE: we assume that no command is pushed to the transaction when a child if open.
        // When a child is closed, its commands are flattened to its parent, and further commands on parents are then in order.
        //
        // This means that children transactions are always at the end of the commands being pushed.
        for (const child of transaction.pendingChildren) {
            this.abortChildTransactions(child);
        }
        transaction.aborted = true;
        // Remove from pendingTransactions BEFORE calling tryUndo.
        //
        // Without this, command.undo() implementations (e.g. CreateNodeCommand.undo →
        // RemoveNodeCommand via runCommandsAsTransaction) call beginTransaction, which
        // sees this transaction still in pendingTransactions and creates a child that
        // inherits aborted=true. packExecute then skips execution entirely, so the
        // undo is silently dropped and nodes are never removed from the scene.
        //
        // Removing first means the undo operations run as root transactions — they
        // execute freely and clean up the scene correctly.
        // endTransaction handles the already-removed case via the `!transaction.pending` guard.
        const pendingIdx = this.pendingTransactions.indexOf(transaction);
        if (pendingIdx !== -1) {
            this.pendingTransactions.splice(pendingIdx, 1);
            transaction.pending = false;
            this.syncOperationInProgress();
        }
        transaction.tryUndo();
        transaction.pendingChildren.length = 0;
    }
    pushTransactionToHistory(transaction) {
        // assertFalse(transaction.aborted, 'Transaction is aborted');
        // assertFalse(transaction.pending, 'Transaction is pending');
        // assertTrue(transaction.pendingChildren.length === 0, 'Transaction has pending children');
        if (transaction.commands.length === 0) {
            return;
        }
        getMonitor().debug(`⏩ Added ${transaction.key} to history with ${transaction.commands.length} commands`);
        if (this.history.length >= this.maxHistoryLength) {
            this.history.shift();
        }
        this.history.push(transaction);
        this.updateCanUndo();
    }
    discardRedoHistory() {
        this.redoHistory.length = 0;
        this.updateCanRedo();
    }
    /**
     * Drops all undo / redo state — `history`, `redoHistory`, and the fold buffer — and
     * refreshes the `canUndo` / `canRedo` signals. For entering a fresh editing context
     * (e.g. a wizard step change) where undoing across the boundary makes no sense. Open
     * (`pendingTransactions`) transactions are left untouched.
     */
    clear() {
        this.history.length = 0;
        this.redoHistory.length = 0;
        this.foldBuffer.length = 0;
        this.updateCanUndo();
        this.updateCanRedo();
    }
    updateCanUndo() {
        this.canUndo.value = this.history.length > 0;
    }
    updateCanRedo() {
        this.canRedo.value = this.redoHistory.length > 0;
    }
    /**
     * Advance both scene-change markers together — the monotonic `sceneRevision` and the
     * `lastUpdateAt` wall-clock stamp. Single write point so a consumer can never observe
     * a revision without its timestamp (or vice versa); inside a `batch()` the pair lands
     * in one effect flush.
     *
     * Reads the revision with `peek()`, never `.value++`: node effects run commands (see
     * `registerNodeEffect`), so this executes inside a Preact tracking context. A tracked
     * read would subscribe the running effect to `sceneRevision`, and the write below would
     * immediately re-dirty it — the effect re-runs, mutates again, and the batch loop spins
     * until Preact throws `Cycle detected`.
     */
    markSceneMutated() {
        this.sceneRevision.value = this.sceneRevision.peek() + 1;
        this.lastUpdateAt.value = Date.now();
    }
    /** Reflect the open-transaction count into the reactive `isOperationInProgress` signal. */
    syncOperationInProgress() {
        this.isOperationInProgress.value = this.pendingTransactions.length > 0;
    }
    // @TODO: incapsulate these methods in the TransactionManager class
    // public canUndo(): boolean {
    //   return this.history.length > 0;
    // }
    // public canRedo(): boolean {
    //   return this.redoHistory.length > 0;
    // }
    /**
     * Reverses the last committed transaction, atomically as far as any tracked consumer is
     * concerned.
     */
    undo() {
        const transaction = this.history[this.history.length - 1];
        if (!transaction) {
            getMonitor().debug('🔁 No transaction to undo');
            return false;
        }
        getMonitor().debug(`↩️ Undo ${transaction.key}`);
        return batch(() => {
            if (transaction.tryUndo()) {
                this.history.pop();
                this.updateCanUndo();
                if (this.redoHistory.length >= this.maxHistoryLength) {
                    this.redoHistory.shift();
                }
                this.redoHistory.push(transaction);
                this.updateCanRedo();
                this.markSceneMutated();
            }
            else {
                getMonitor().error(`🔥 Failed to undo transaction ${transaction.key}`);
                return false;
            }
            return true;
        });
    }
    /** Re-applies the last undone transaction. Batched for the same reason {@link undo} is. */
    redo() {
        if (this.history.length > 0) {
            const lastTransaction = this.history[this.history.length - 1];
            // make sure to apply any partially undone transaction first
            if (lastTransaction.undoneCommands.length > 0) {
                return batch(() => {
                    lastTransaction.redo();
                    this.markSceneMutated();
                    return true;
                });
            }
        }
        const transaction = this.redoHistory.pop();
        if (!transaction) {
            getMonitor().debug('🔁 No transaction to redo');
            return false;
        }
        getMonitor().debug(`↪️ Redo ${transaction.key}`);
        return batch(() => {
            transaction.redo();
            this.pushTransactionToHistory(transaction);
            this.updateCanUndo();
            this.updateCanRedo();
            this.markSceneMutated();
            return true;
        });
    }
    getPendingTransaction(key) {
        return this.pendingTransactions.find((t) => t.key === key);
    }
}

export { TransactionManager };
