import type { IPointerGestureSource, ReadonlySignal } from '../../declarations/IPointerGestureSource';
/**
 * Designer-wide pointer tracker — single source of truth for the active touch
 * count, the pinch-zoom factor, the "gesture became multi-touch" latch, and
 * gesture-reset notifications. The single sanctioned implementation of
 * {@link IPointerGestureSource}.
 *
 * Owned by `CoreDesigner`, attached to its `domElement` on construction and
 * disposed when the core is. It is the ONLY thing in the designer that listens
 * to `window`/`document` pointer-lifecycle events — every other consumer
 * subscribes through the {@link IPointerGestureSource} contract instead of
 * wiring its own global listeners.
 *
 * Why on `core`: both `@moon/designer-ui` (drag-session arbitration in
 * `useDraggable` / `Item`) and `@moon/designer3d` (camera-driven pinch in its
 * own `Handlers`) need the same touch state without depending on each other.
 * `core` is the only shared layer, and capture-phase listeners on
 * `core.domElement` see every pointer event in the designer subtree before
 * any descendant can stop them — so a second finger landing anywhere flips the
 * latch and pushes synchronously to every observer.
 *
 * Touch-only filter: mouse never escalates to multi-pointer; Pencil is a
 * single-point device today (CLAUDE.md rule 4: Pencil-reachable, not
 * Pencil-tracked).
 */
export interface CoreHandlersOptions {
    /**
     * When `true`, accept synthetic (programmatically dispatched) pointer
     * events — i.e. events whose `isTrusted` is `false`. Default `false`:
     * production rejects them so internal `new PointerEvent(...)` dispatches
     * (the contextmenu synthesizer in `@moon/designer3d`, etc.) don't
     * re-enter and double-count.
     *
     * Tests that dispatch synthetic touches via `element.dispatchEvent(...)`
     * must set this `true` to exercise the multi-touch path.
     */
    allowSynthetic?: boolean;
}
export declare class CoreHandlers implements IPointerGestureSource {
    private readonly target;
    /** Live count of touch pointers currently down. Capped at 2 — see
     *  `onPointerDown` for the rationale. */
    get count(): number;
    /**
     * Latched "this gesture became multi-touch" flag. Read-only to the outside
     * world (exposed as a {@link ReadonlySignal}); only this class flips it —
     * `true` when the second finger lands, `false` when all fingers lift. See
     * the transitions in `onPointerDown` / `onPointerEnd` / `reset`.
     */
    get gestureWasMulti(): ReadonlySignal<boolean>;
    /**
     * Subscribe to pinch-zoom delta notifications. The callback receives a
     * `factor` representing the ratio between the current finger-pair distance
     * and the previous frame's — `> 1` means fingers spreading (zoom in),
     * `< 1` means fingers closing (zoom out).
     *
     * Fires only when 2+ touch pointers are down AND the distance changed by
     * more than the dead-zone threshold. State (baseline distance, pointer IDs)
     * lives here so consumers can stay stateless and just apply the factor.
     *
     * Returns an unsubscribe function.
     */
    onPinch: (callback: (factor: number) => void) => (() => void);
    /**
     * Subscribe to gesture-reset notifications. Fired from `reset()` (foreground
     * loss: app switch, Control Center, navigation) so canvas-side trackers can
     * clear their own pointer state without listening to `window` themselves —
     * this class stays the sole owner of the global listeners. Returns an
     * unsubscribe function.
     */
    onReset: (callback: () => void) => (() => void);
    /** Release listeners. Called by `CoreDesigner.dispose()`. */
    dispose: () => void;
    private readonly activeTouchPointers;
    /**
     * Backing signal for {@link gestureWasMulti}. Private so only this class
     * can `set` it; consumers see the read-only `get`/`peek` view.
     */
    private readonly _gestureWasMulti;
    /** Reset-notification subscribers — see {@link onReset}. */
    private readonly resetSubscribers;
    /**
     * Live client-space position of every currently-down touch pointer, keyed
     * by pointer id. Insertion order = touch-down order — used by `computePinch`
     * to take "the first two" deterministically.
     */
    private readonly pointerPositions;
    private readonly pinchSubscribers;
    /**
     * Pre-snapshotted subscriber list, rebuilt only when the subscriber set
     * changes. Avoids a fresh allocation on every `computePinch` (up to
     * ~240 events/s at ProMotion 120 Hz with 2 fingers). Synchronous
     * subscribe/unsubscribe inside a callback marks `dirty` for the next
     * rebuild — the in-flight iteration uses the stable cache.
     */
    private pinchSubscriberCache;
    private pinchSubscribersDirty;
    /**
     * Last frame's finger-pair distance. Zeroed when the gesture leaves the 2+
     * window so the next pinch re-seeds rather than computing from a stale
     * baseline (was the "2× jump between pinches" bug).
     */
    private pinchPrevDistance;
    /**
     * IDs of the two pointers tracked as the current pinch baseline. If the
     * pointer set changes between frames (gesture ended without a final move,
     * finger swap) we re-seed instead of computing `factor` against a baseline
     * measured between different fingers.
     */
    private pinchIds;
    private attached;
    private readonly allowSynthetic;
    constructor(target: HTMLElement, options?: CoreHandlersOptions);
    private attach;
    /**
     * Recompute the pinch factor against the last frame's distance and notify
     * subscribers. No-op when fewer than 2 touch pointers are down or no
     * consumer is subscribed.
     */
    private computePinch;
    private readonly onPointerDown;
    private readonly onPointerMove;
    private readonly onPointerEnd;
    private readonly onVisibilityChange;
    /** Catches focus-stealing OS surfaces (Control Center, Notification Center,
     *  Slide Over) on iPad WKWebView that don't fire `visibilitychange`. */
    private readonly onForegroundLost;
    /**
     * Drop all live gesture state. Used by foreground-loss handlers when the
     * OS may have swallowed `pointercancel` for some pointers, leaving ghost
     * IDs that would poison the next gesture. Notifies `onReset` subscribers
     * AFTER local state is cleared, so canvas-side trackers reset against a
     * clean baseline.
     */
    private reset;
}
