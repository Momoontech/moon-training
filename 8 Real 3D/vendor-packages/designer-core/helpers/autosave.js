import { signal, computed } from '@preact/signals-react';

/**
 * Change-driven, operation-deferred autosave. Saves only when the scene actually changed
 * since the last save, and never in the middle of an edit operation.
 *
 * Two `TransactionManager` signals drive it:
 * - `sceneRevision` — advances on every committed edit (incl. `addToHistory=false`) and on
 *   undo / redo, and deliberately NOT on fold-only selection / hover / view-mode packs. It
 *   is the dirty check: `revision !== savedRevision`. This is what removes the redundant
 *   saves — no serialization at all for a scene nobody edited.
 * - `isOperationInProgress` — `true` while any transaction is open. A drag / draw gesture
 *   holds one open from pointerdown to pointerup, so nothing is persisted mid-gesture; the
 *   `true → false` edge re-runs the effect and flushes once, with the settled scene.
 *
 * Ordering guarantees:
 * - `save` NEVER runs inside the tracked effect scope — every flush goes through a timer.
 *   Otherwise a `save` that reads the scene (`core.saveArea()` walks the node tree through
 *   tracked `Value.get()` reads) would subscribe this effect to the whole project and
 *   re-enter on any signal change.
 * - At most one `save` in flight. The revision is captured BEFORE awaiting, so edits that
 *   land during the save stay dirty and get their own flush right after.
 * - A failed save does not self-reschedule (no hot-looping against a failing endpoint) —
 *   it stays dirty and retries on the next edit or `requestSave()`.
 *
 * Camera / controls state is NOT covered: `e3CameraData` & co. are written directly rather
 * than through a command, so an orbit-only change does not advance `sceneRevision` and will
 * not, on its own, trigger a save.
 *
 * `trigger` decides who releases a pending save — the edit itself (`'change'`, the default) or the
 * host (`'request'`). Either way the gate is the same; only the trigger differs.
 *
 * ```ts
 * // Host-paced: an expensive upload stays on the host's cadence, gated on change + operation.
 * const autosave = registerAutosave(core, {
 *   save: async () => upload((await core.saveArea()).appData),
 *   trigger: 'request'
 * });
 * const id = setInterval(autosave.requestSave, 20_000);
 * // teardown: clearInterval(id); autosave.dispose();
 * ```
 */
const registerAutosave = (core, options) => {
    const { save, trigger = 'change', debounceMs = 0, onError } = options;
    const transactionManager = core.transactionManager;
    const savedRevision = signal(transactionManager.sceneRevision.peek());
    const isDirty = computed(() => transactionManager.sceneRevision.value !== savedRevision.value);
    let timer = null;
    let isSaving = false;
    let hasPendingFlush = false;
    let isDisposed = false;
    /** Callers awaiting `requestSave()`, resolved when the flush they asked for has settled. */
    let waiters = [];
    /** Survives deferral: a forced request held open by an operation must still skip the dirty check. */
    let isForced = false;
    const cancelTimer = () => {
        if (timer === null)
            return;
        clearTimeout(timer);
        timer = null;
    };
    const settleAll = () => {
        const pending = waiters;
        waiters = [];
        for (const resolve of pending)
            resolve();
    };
    const flush = async () => {
        timer = null;
        if (isDisposed)
            return settleAll();
        // A trigger landing mid-save is remembered rather than dropped — the tail re-schedules.
        if (isSaving) {
            hasPendingFlush = true;
            return;
        }
        // Non-tracking reads: `flush` always runs from a timer, i.e. outside the effect scope,
        // and must not add subscriptions of its own.
        const revision = transactionManager.sceneRevision.peek();
        // `forceSave` skips this check and only this one — the two gates below still apply.
        if (!isForced && revision === savedRevision.peek()) {
            hasPendingFlush = false;
            return settleAll();
        }
        // An operation is open — hold the request; the effect releases it at the operation's close.
        if (transactionManager.isOperationInProgress.peek()) {
            hasPendingFlush = true;
            return;
        }
        hasPendingFlush = false;
        isForced = false;
        // Only callers who asked BEFORE this save started are settled by it; a request arriving
        // during it stays queued and is settled by its own flush.
        const settling = waiters;
        waiters = [];
        const context = { revision, lastUpdateAt: transactionManager.lastUpdateAt.peek() };
        let succeeded = false;
        isSaving = true;
        try {
            await save(context);
            // The revision captured before the await — anything newer is still unsaved. Never move
            // the marker BACKWARDS: a `markSaved()` landing mid-save (host persisted through another
            // path) may already have advanced it past `revision`, and rewinding would re-dirty an
            // already-saved scene and provoke a redundant save. `sceneRevision` is monotonic, so
            // comparing values is sufficient.
            if (revision > savedRevision.peek()) {
                savedRevision.value = revision;
            }
            succeeded = true;
        }
        catch (error) {
            onError?.(error, context);
        }
        finally {
            isSaving = false;
        }
        for (const resolve of settling)
            resolve();
        const isStillDirty = transactionManager.sceneRevision.peek() !== savedRevision.peek();
        // Re-run for a trigger that arrived while the save was in flight, and — in `'change'` mode
        // only — for edits that landed during it (in `'request'` mode the host's next trigger owns
        // them). A plain failure does NOT self-reschedule: it waits for the next edit / request
        // instead of hot-looping against a failing endpoint.
        if (!isDisposed && (hasPendingFlush || (trigger === 'change' && succeeded && isStillDirty))) {
            schedule();
        }
    };
    const arm = (delayMs) => {
        cancelTimer();
        timer = setTimeout(() => {
            void flush();
        }, delayMs);
    };
    const schedule = () => {
        if (isDisposed)
            return;
        // With no window an already-armed timer is left alone — it fires on the next macrotask
        // anyway; with one, each new edit restarts it so a burst coalesces into a single save.
        if (timer !== null && debounceMs <= 0)
            return;
        arm(Math.max(0, debounceMs));
    };
    // Host-driven trigger: skips the coalescing window (the host's own cadence IS the window)
    // but still goes through a timer so `save` never runs inside a caller's tracked scope.
    const requestSave = (options) => {
        if (isDisposed)
            return Promise.resolve();
        if (options?.forceSave)
            isForced = true;
        const settled = new Promise((resolve) => waiters.push(resolve));
        arm(0);
        return settled;
    };
    const disposeEffect = core.registerEffect(() => {
        const dirty = isDirty.value;
        const isOperationInProgress = transactionManager.isOperationInProgress.value;
        // A forced request is released even on a clean scene — the one case the dirty check does not
        // decide. `isForced` is a plain flag, but the operation's `true → false` edge re-runs this
        // effect anyway, which is exactly when a held forced request needs releasing.
        if (isDisposed || (!dirty && !isForced))
            return;
        // Deferred, not dropped: closing the operation re-runs this effect.
        if (isOperationInProgress)
            return;
        // In `'request'` mode the edit alone is not a trigger — only a request the gate had to hold
        // (because an operation was open, or a save was in flight) is released here.
        if (trigger === 'request' && !hasPendingFlush)
            return;
        schedule();
    });
    return {
        isDirty,
        savedRevision,
        requestSave,
        markSaved: () => {
            savedRevision.value = transactionManager.sceneRevision.peek();
        },
        dispose: () => {
            isDisposed = true;
            cancelTimer();
            disposeEffect();
            // Nobody is left awaiting a flush that will never run.
            settleAll();
        }
    };
};

export { registerAutosave };
