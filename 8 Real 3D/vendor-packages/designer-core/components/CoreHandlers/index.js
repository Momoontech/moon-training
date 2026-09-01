import CoreSignal from '../CoreSignal/index.js';
import { getMonitor } from '../../helpers/monitor.js';

/**
 * Sub-pixel jitter threshold for the pinch factor. A factor in
 * `[1 - PINCH_DEAD_ZONE, 1 + PINCH_DEAD_ZONE]` is treated as no-change and
 * not dispatched — silences the steady-finger noise that otherwise produces
 * camera micro-jitter at rest.
 */
const PINCH_DEAD_ZONE = 1e-4;
class CoreHandlers {
    target;
    /** Live count of touch pointers currently down. Capped at 2 — see
     *  `onPointerDown` for the rationale. */
    get count() {
        return this.activeTouchPointers.size;
    }
    /**
     * Latched "this gesture became multi-touch" flag. Read-only to the outside
     * world (exposed as a {@link ReadonlySignal}); only this class flips it —
     * `true` when the second finger lands, `false` when all fingers lift. See
     * the transitions in `onPointerDown` / `onPointerEnd` / `reset`.
     */
    get gestureWasMulti() {
        return this._gestureWasMulti;
    }
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
    onPinch = (callback) => {
        this.pinchSubscribers.add(callback);
        this.pinchSubscribersDirty = true;
        return () => {
            this.pinchSubscribers.delete(callback);
            this.pinchSubscribersDirty = true;
        };
    };
    /**
     * Subscribe to gesture-reset notifications. Fired from `reset()` (foreground
     * loss: app switch, Control Center, navigation) so canvas-side trackers can
     * clear their own pointer state without listening to `window` themselves —
     * this class stays the sole owner of the global listeners. Returns an
     * unsubscribe function.
     */
    onReset = (callback) => {
        this.resetSubscribers.add(callback);
        return () => {
            this.resetSubscribers.delete(callback);
        };
    };
    /** Release listeners. Called by `CoreDesigner.dispose()`. */
    dispose = () => {
        if (!this.attached)
            return;
        // Remove listeners FIRST, then clear internal state — otherwise a re-entrant
        // `pointerdown` between the clear and the removal would mutate state with
        // no listeners to observe it, leaving the next attach inconsistent.
        this.target.removeEventListener('pointerdown', this.onPointerDown, { capture: true });
        this.target.removeEventListener('pointermove', this.onPointerMove, { capture: true });
        this.target.removeEventListener('pointerup', this.onPointerEnd, { capture: true });
        this.target.removeEventListener('pointercancel', this.onPointerEnd, { capture: true });
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('blur', this.onForegroundLost);
        window.removeEventListener('pagehide', this.onForegroundLost);
        this.attached = false;
        this.pinchSubscribers.clear();
        this.pinchSubscriberCache = [];
        this.pinchSubscribersDirty = false;
        this.resetSubscribers.clear();
        this.activeTouchPointers.clear();
        this.pointerPositions.clear();
        this.pinchPrevDistance = 0;
        this.pinchIds = null;
        this._gestureWasMulti.set(false);
    };
    // ── Internal state ─────────────────────────────────────────────────────
    activeTouchPointers = new Set();
    /**
     * Backing signal for {@link gestureWasMulti}. Private so only this class
     * can `set` it; consumers see the read-only `get`/`peek` view.
     */
    _gestureWasMulti = new CoreSignal(false);
    /** Reset-notification subscribers — see {@link onReset}. */
    resetSubscribers = new Set();
    /**
     * Live client-space position of every currently-down touch pointer, keyed
     * by pointer id. Insertion order = touch-down order — used by `computePinch`
     * to take "the first two" deterministically.
     */
    pointerPositions = new Map();
    pinchSubscribers = new Set();
    /**
     * Pre-snapshotted subscriber list, rebuilt only when the subscriber set
     * changes. Avoids a fresh allocation on every `computePinch` (up to
     * ~240 events/s at ProMotion 120 Hz with 2 fingers). Synchronous
     * subscribe/unsubscribe inside a callback marks `dirty` for the next
     * rebuild — the in-flight iteration uses the stable cache.
     */
    pinchSubscriberCache = [];
    pinchSubscribersDirty = false;
    /**
     * Last frame's finger-pair distance. Zeroed when the gesture leaves the 2+
     * window so the next pinch re-seeds rather than computing from a stale
     * baseline (was the "2× jump between pinches" bug).
     */
    pinchPrevDistance = 0;
    /**
     * IDs of the two pointers tracked as the current pinch baseline. If the
     * pointer set changes between frames (gesture ended without a final move,
     * finger swap) we re-seed instead of computing `factor` against a baseline
     * measured between different fingers.
     */
    pinchIds = null;
    attached = false;
    allowSynthetic;
    constructor(target, options = {}) {
        this.target = target;
        this.allowSynthetic = options.allowSynthetic ?? false;
        this.attach();
    }
    attach = () => {
        if (this.attached)
            return;
        // Capture-phase + passive: we never `preventDefault` — purely observational.
        // Capture lets us see events before any descendant can `stopPropagation`.
        this.target.addEventListener('pointerdown', this.onPointerDown, { capture: true, passive: true });
        this.target.addEventListener('pointermove', this.onPointerMove, { capture: true, passive: true });
        this.target.addEventListener('pointerup', this.onPointerEnd, { capture: true, passive: true });
        this.target.addEventListener('pointercancel', this.onPointerEnd, { capture: true, passive: true });
        // Foreground-loss resets. `visibilitychange` covers app-switching
        // (4-finger swipe up). `blur` catches iPad Control Center /
        // Notification Center swipes — those do NOT fire `visibilitychange`
        // (app isn't backgrounded) but DO take focus from the WKWebView.
        // `pagehide` covers actual navigation. Without these, a pointercancel
        // the OS swallowed leaves a ghost pointer that poisons the next gesture.
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        window.addEventListener('blur', this.onForegroundLost);
        window.addEventListener('pagehide', this.onForegroundLost);
        this.attached = true;
    };
    /**
     * Recompute the pinch factor against the last frame's distance and notify
     * subscribers. No-op when fewer than 2 touch pointers are down or no
     * consumer is subscribed.
     */
    computePinch() {
        if (this.activeTouchPointers.size < 2 || this.pinchSubscribers.size === 0) {
            this.pinchPrevDistance = 0;
            this.pinchIds = null;
            return;
        }
        // First two tracked pointers (Map preserves insertion order).
        const iter = this.pointerPositions.entries();
        const first = iter.next().value;
        const second = iter.next().value;
        if (!first || !second)
            return;
        const [aId, a] = first;
        const [bId, b] = second;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const sameFingers = this.pinchIds !== null && this.pinchIds[0] === aId && this.pinchIds[1] === bId;
        // Re-seed on first frame OR when the pointer set changes (new gesture,
        // finger swap). Don't emit a factor yet — we need a baseline.
        if (!sameFingers || this.pinchPrevDistance <= 0) {
            if (this.pinchIds === null)
                this.pinchIds = [aId, bId];
            else {
                this.pinchIds[0] = aId;
                this.pinchIds[1] = bId;
            }
            this.pinchPrevDistance = distance;
            return;
        }
        const factor = distance / this.pinchPrevDistance;
        this.pinchPrevDistance = distance;
        if (Math.abs(factor - 1) < PINCH_DEAD_ZONE)
            return;
        // Rebuild the cache only when subscribers changed since last walk —
        // avoids a fresh array allocation on every event in the 240 Hz hot path.
        if (this.pinchSubscribersDirty) {
            this.pinchSubscriberCache = Array.from(this.pinchSubscribers);
            this.pinchSubscribersDirty = false;
        }
        for (const cb of this.pinchSubscriberCache) {
            try {
                cb(factor);
            }
            catch (err) {
                getMonitor().error('[CoreHandlers] pinch subscriber threw', err instanceof Error ? err : null);
            }
        }
    }
    onPointerDown = (e) => {
        // Reject synthetic events by default — `isTrusted` is the
        // user-agent-vs-script discriminator (browser sets it `false` on any
        // event created via `new PointerEvent(...)` and dispatched
        // programmatically). Tests can opt in via `allowSynthetic`.
        if (!this.allowSynthetic && !e.isTrusted)
            return;
        if (e.pointerType !== 'touch')
            return;
        // Cap at 2 touches — a 3rd+ finger is ignored entirely. It is never
        // recorded in `activeTouchPointers` / `pointerPositions`, so `count`
        // stays at 2, pinch math continues with the original two fingers, and
        // a later `pointerup` for the 3rd is a no-op (`delete` on an absent
        // id). Matches the canvas-side cap in `@moon/designer3d`'s Handlers.
        if (this.activeTouchPointers.size >= 2)
            return;
        // Reset the latch on the START of a new gesture (set was empty before
        // this add). We CANNOT reset on the end of the previous gesture: on iPad
        // WebKit + React 19, microtasks scheduled inside a capture-phase listener
        // drain BEFORE the bubble-phase React handler of the SAME event — so any
        // deferred reset is visible to the trailing pointerup, defeating the
        // whole guard. Resetting here keeps the latch `true` through every
        // trailing handler, and the next genuine fresh tap correctly sees `false`.
        if (this.activeTouchPointers.size === 0 && this._gestureWasMulti.peek()) {
            this._gestureWasMulti.set(false);
        }
        this.activeTouchPointers.add(e.pointerId);
        this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.activeTouchPointers.size === 2)
            this._gestureWasMulti.set(true);
    };
    onPointerMove = (e) => {
        if (!this.allowSynthetic && !e.isTrusted)
            return;
        if (e.pointerType !== 'touch')
            return;
        // Only track pointers we already counted on `pointerdown`. A move for an
        // untracked id is ignored so `pointerPositions` never drifts out of sync
        // with `activeTouchPointers`.
        const position = this.pointerPositions.get(e.pointerId);
        if (!position)
            return;
        position.x = e.clientX;
        position.y = e.clientY;
        this.computePinch();
    };
    onPointerEnd = (e) => {
        if (!this.allowSynthetic && !e.isTrusted)
            return;
        if (e.pointerType !== 'touch')
            return;
        this.activeTouchPointers.delete(e.pointerId);
        this.pointerPositions.delete(e.pointerId);
        // Clear pinch baseline when the gesture leaves the 2+ window — the next
        // pinch must re-seed instead of computing against this one's last distance.
        if (this.activeTouchPointers.size < 2) {
            this.pinchPrevDistance = 0;
            this.pinchIds = null;
        }
        // NOTE: The latch is intentionally NOT reset here when count hits 0.
        // The reset happens in `onPointerDown` on the START of the next fresh
        // gesture. Resetting here — even via microtask — leaks `false` into the
        // bubble-phase React handlers of the LAST pointerup (iPad WebKit drains
        // microtasks between capture and bubble of the same event), which would
        // commit a spurious trailing selection. Keeping the latch sticky until
        // the next gesture is the only timing-robust option.
    };
    onVisibilityChange = () => {
        if (document.hidden)
            this.reset();
    };
    /** Catches focus-stealing OS surfaces (Control Center, Notification Center,
     *  Slide Over) on iPad WKWebView that don't fire `visibilitychange`. */
    onForegroundLost = () => {
        this.reset();
    };
    /**
     * Drop all live gesture state. Used by foreground-loss handlers when the
     * OS may have swallowed `pointercancel` for some pointers, leaving ghost
     * IDs that would poison the next gesture. Notifies `onReset` subscribers
     * AFTER local state is cleared, so canvas-side trackers reset against a
     * clean baseline.
     */
    reset() {
        this.activeTouchPointers.clear();
        this.pointerPositions.clear();
        this.pinchPrevDistance = 0;
        this.pinchIds = null;
        this._gestureWasMulti.set(false);
        for (const cb of this.resetSubscribers) {
            try {
                cb();
            }
            catch (err) {
                getMonitor().error('[CoreHandlers] reset subscriber threw', err instanceof Error ? err : null);
            }
        }
    }
}

export { CoreHandlers };
