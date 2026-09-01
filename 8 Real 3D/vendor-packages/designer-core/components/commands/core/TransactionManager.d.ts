import { CoreDesigner } from '../../../';
import { Command } from './Command';
import Transaction from './Transaction';
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
export declare class TransactionManager {
    core: CoreDesigner;
    maxHistoryLength: number;
    history: Transaction[];
    redoHistory: Transaction[];
    /** Fold commands committed while history was empty; prepended onto the next edit. */
    private foldBuffer;
    pendingTransactions: Transaction[];
    canUndo: import("@preact/signals-core").Signal<boolean>;
    canRedo: import("@preact/signals-core").Signal<boolean>;
    /**
     * Monotonic counter bumped once per applied scene mutation — every committed
     * edit pack (history and non-history) plus each undo / redo. Consumers read it
     * inside a tracked scope (e.g. `core.registerEffect`) as a "the scene changed"
     * trigger; the absolute value is meaningless, only that it advanced. Unlike
     * `canUndo`, it fires on *every* edit, not just the empty↔non-empty history
     * boundary, and it deliberately does NOT fire for fold-only operations
     * (selection / hover / view-mode) which do not mutate persisted scene data.
     */
    sceneRevision: import("@preact/signals-core").Signal<number>;
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
    lastUpdateAt: import("@preact/signals-core").Signal<number>;
    /**
     * `true` while any transaction is open (`pendingTransactions` non-empty) — i.e.
     * a drag / draw / multi-command gesture is mid-flight. Drag handlers and the
     * draw session open a long-lived transaction on pointerdown and close it on
     * pointerup, so this stays `true` for the whole gesture (short atomic packs
     * open and close within a single `batch()`, so a tracked consumer only ever
     * observes the settled value). Its `true → false` edge marks "operation
     * finished" — the moment a deferred autosave should flush.
     */
    isOperationInProgress: import("@preact/signals-core").Signal<boolean>;
    constructor(core: CoreDesigner);
    beginTransaction(key: string, addToHistory?: boolean): Transaction;
    endTransaction(transaction: Transaction): void;
    /** {@link HistoryBehavior.Fold} only if non-empty and every command folds; else {@link HistoryBehavior.Edit}. */
    private classifyTransaction;
    /**
     * Appends a fold-only transaction onto the current undo target (no new step). A fold is
     * still a *new operation*, so — like an edit — it discards the redo branch: once the user
     * acts again after an undo, the future they could have redone no longer applies. With no
     * clean anchor (empty history / partially-undone tail), buffers instead.
     */
    private foldTransaction;
    /** Commits a real edit as a new step; flushes any buffered folds to the FRONT first (for LIFO undo). */
    private commitEditTransaction;
    abortTransaction(transaction: Transaction): void;
    runCommandsAsTransaction(commands: Command | Command[], transactionName?: string, addToHistory?: boolean): boolean;
    private packExecute;
    private abortChildTransactions;
    private pushTransactionToHistory;
    discardRedoHistory(): void;
    /**
     * Drops all undo / redo state — `history`, `redoHistory`, and the fold buffer — and
     * refreshes the `canUndo` / `canRedo` signals. For entering a fresh editing context
     * (e.g. a wizard step change) where undoing across the boundary makes no sense. Open
     * (`pendingTransactions`) transactions are left untouched.
     */
    clear(): void;
    updateCanUndo(): void;
    updateCanRedo(): void;
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
    private markSceneMutated;
    /** Reflect the open-transaction count into the reactive `isOperationInProgress` signal. */
    private syncOperationInProgress;
    /**
     * Reverses the last committed transaction, atomically as far as any tracked consumer is
     * concerned.
     */
    undo(): boolean;
    /** Re-applies the last undone transaction. Batched for the same reason {@link undo} is. */
    redo(): boolean;
    getPendingTransaction(key: string): Transaction | undefined;
}
