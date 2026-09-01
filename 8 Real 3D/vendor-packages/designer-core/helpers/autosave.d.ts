import { ReadonlySignal } from '@preact/signals-react';
import { CoreDesigner } from '..';
/** State handed to the `save` callback, captured at the moment the flush starts. */
export interface AutosaveContext {
    /** `transactionManager.sceneRevision` when the flush started — what gets marked saved on success. */
    revision: number;
    /** `transactionManager.lastUpdateAt` when the flush started (epoch ms; `0` = never edited). */
    lastUpdateAt: number;
}
/**
 * What releases a pending save.
 * - `'change'` — the edit itself: flushes as soon as the scene is dirty and no operation is open.
 *   For a cheap, local persist where "save right after the user finishes an action" is wanted.
 * - `'request'` — only `requestSave()` (a host interval, a Save button, a step change). The gate
 *   still applies: a request arriving mid-operation is held and flushed at the operation's close.
 *   For an expensive persist (a full-scene network upload) whose cadence the host owns.
 */
export type AutosaveTrigger = 'change' | 'request';
export interface AutosaveOptions {
    /**
     * Performs the actual persist. Awaited — a rejected promise (or a throw) leaves the
     * scene dirty so the next trigger retries. Called at most once at a time.
     */
    save: (context: AutosaveContext) => void | Promise<void>;
    /** Who decides when a dirty scene is written. Defaults to `'change'`. */
    trigger?: AutosaveTrigger;
    /**
     * Coalescing window in ms before a flush. Each new edit restarts it, so a burst of
     * discrete edits produces one save. `0` (default) flushes on the next macrotask.
     * The gate is orthogonal: a flush never starts while an operation is open, whatever
     * this is set to.
     */
    debounceMs?: number;
    /** Called when `save` rejects. Without it a failed save is silent (the retry still happens). */
    onError?: (error: unknown, context: AutosaveContext) => void;
}
export interface AutosaveHandle {
    /** Reactive: unsaved scene edits exist (`sceneRevision` ahead of the last saved one). */
    isDirty: ReadonlySignal<boolean>;
    /** Reactive: the `sceneRevision` value of the last successful save. */
    savedRevision: ReadonlySignal<number>;
    /**
     * Ask for a flush now. Deferred (not dropped) while an operation is open or a save is in flight.
     * Resolves when that flush settles; never rejects — failures go to `onError`.
     * `forceSave` skips only the dirty check; the operation and in-flight gates still apply.
     */
    requestSave: (options?: {
        forceSave?: boolean;
    }) => Promise<void>;
    /**
     * Mark the current scene as saved WITHOUT calling `save` — for a host that persisted
     * through another path (e.g. flushing a staged offline snapshot on reconnect).
     */
    markSaved: () => void;
    /** Stops watching and cancels a pending flush. An in-flight `save` still completes. */
    dispose: () => void;
}
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
export declare const registerAutosave: (core: CoreDesigner, options: AutosaveOptions) => AutosaveHandle;
export default registerAutosave;
