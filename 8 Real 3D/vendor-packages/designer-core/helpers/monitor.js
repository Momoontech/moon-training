/**
 * Internal message bus that fans out structured log/track events to registered
 * {@link IMonitor} middlewares.
 *
 * All methods except {@link MonitorBus.monitor | monitor.error} are
 * **asynchronous** — calls are enqueued and dispatched as a single microtask
 * batch, so high-frequency log calls do not stall the call site.
 * `error` is the sole exception: it dispatches **synchronously** so the event
 * is never lost if execution crashes immediately after the call.
 *
 * @internal — consume via {@link getMonitor}, {@link addMonitorMiddleware},
 * and {@link removeMonitorMiddleware} instead of instantiating directly.
 */
class MonitorBus {
    /** Ordered list of active middlewares; fan-out target for every flush. */
    middlewares = [];
    /** Pending entries waiting to be dispatched on the next microtask tick. */
    queue = [];
    /** Guards against scheduling more than one microtask at a time. */
    flushScheduled = false;
    /**
     * Drains {@link queue} and dispatches each entry to every registered
     * middleware.  Stored as a bound arrow property so the same function
     * reference is passed to `queueMicrotask` on every call — no closure
     * allocation at the call site.
     *
     * Each middleware call is wrapped in its own try/catch so a throwing
     * middleware never silently drops subsequent entries or unnotified peers.
     * `console.error` is the only available escape hatch here — using the
     * monitor itself would risk infinite recursion.
     */
    flush = () => {
        this.flushScheduled = false;
        const entries = this.queue.splice(0);
        for (const { method, args } of entries) {
            for (const m of this.middlewares) {
                try {
                    m[method](...args);
                }
                catch (e) {
                    console.error('[MonitorBus] middleware threw during flush', e);
                }
            }
        }
    };
    /**
     * Schedules a single microtask to drain the queue.
     * No-ops if a microtask is already pending, so repeated calls within the
     * same synchronous turn coalesce into one flush.
     */
    scheduleFlush() {
        if (this.flushScheduled)
            return;
        this.flushScheduled = true;
        queueMicrotask(this.flush);
    }
    /**
     * Registers a middleware to receive all future log events.
     * Idempotent — adding the same instance twice has no effect.
     *
     * @param middleware - The {@link IMonitor} implementation to register.
     */
    addMiddleware(middleware) {
        if (!this.middlewares.includes(middleware)) {
            this.middlewares.push(middleware);
        }
    }
    /**
     * Removes a previously registered middleware.
     * No-ops silently if the middleware was never registered.
     *
     * @param middleware - The {@link IMonitor} implementation to remove.
     */
    removeMiddleware(middleware) {
        const i = this.middlewares.indexOf(middleware);
        if (i !== -1)
            this.middlewares.splice(i, 1);
    }
    /**
     * Singleton {@link IMonitor} facade exposed to consumers via
     * {@link getMonitor}.  Frozen so the reference is stable and accidental
     * property mutation is caught at runtime.
     *
     * - `log` / `warn` / `debug` / `track` — enqueue and flush asynchronously.
     * - `error` — dispatches **synchronously** to every middleware so the event
     *   is never lost even if the process crashes on the very next line.
     */
    monitor = Object.freeze({
        log: (msg, ...args) => {
            this.queue.push({ method: 'log', args: [msg, ...args] });
            this.scheduleFlush();
        },
        warn: (msg, ...args) => {
            this.queue.push({ method: 'warn', args: [msg, ...args] });
            this.scheduleFlush();
        },
        error: (msg, error, ctx) => {
            for (const m of this.middlewares) {
                try {
                    m.error(msg, error, ctx);
                }
                catch (e) {
                    console.error('[MonitorBus] middleware threw during synchronous error dispatch', e);
                }
            }
        },
        debug: (msg, ...args) => {
            this.queue.push({ method: 'debug', args: [msg, ...args] });
            this.scheduleFlush();
        },
        track: (event, props) => {
            this.queue.push({ method: 'track', args: [event, props] });
            this.scheduleFlush();
        },
    });
}
const bus = new MonitorBus();
/**
 * Registers a middleware that will receive all future monitor events.
 *
 * Call this once during app initialisation — typically before any business
 * logic runs — to wire up your logging/analytics backend:
 *
 * ```ts
 * addMonitorMiddleware({
 *   log:   (msg, ...args) => console.log(msg, ...args),
 *   warn:  (msg, ...args) => console.warn(msg, ...args),
 *   error: (msg, err)     => Sentry.captureException(err, { extra: { msg } }),
 *   debug: (msg, ...args) => console.debug(msg, ...args),
 *   track: (event, props) => analytics.track(event, props),
 * });
 * ```
 *
 * Idempotent — registering the same instance twice has no effect.
 *
 * @param middleware - An object implementing {@link IMonitor}.
 * @see removeMonitorMiddleware
 */
function addMonitorMiddleware(middleware) {
    bus.addMiddleware(middleware);
}
/**
 * Removes a previously registered middleware.
 * No-ops silently if the middleware was never registered.
 *
 * Useful during teardown or when swapping out a logging backend at runtime:
 *
 * ```ts
 * removeMonitorMiddleware(myMiddleware);
 * ```
 *
 * @param middleware - The same instance that was passed to
 *   {@link addMonitorMiddleware}.
 * @see addMonitorMiddleware
 */
function removeMonitorMiddleware(middleware) {
    bus.removeMiddleware(middleware);
}
/**
 * Returns the application-wide {@link IMonitor} singleton.
 *
 * The returned object is shared and frozen — every call returns the same
 * reference, so there is no allocation overhead at the call site.
 *
 * Usage:
 * ```ts
 * const monitor = getMonitor();
 *
 * monitor.log('User opened project', projectId);
 * monitor.warn('Catalog entry not found', path);
 * monitor.error('Command failed', error, { commandName: 'CreateNode' });
 * monitor.debug('tick duration', durationMs);
 * monitor.track('project_saved', { roomCount });
 * ```
 *
 * > **Dispatch semantics**
 * > - `log`, `warn`, `debug`, `track` — enqueued and flushed as a single
 * >   microtask batch; safe to call in hot paths.
 * > - `error` — dispatched **synchronously** to every middleware; use for
 * >   fatal conditions where a subsequent crash must not swallow the event.
 *
 * @returns The shared {@link IMonitor} instance.
 * @see addMonitorMiddleware
 * @see removeMonitorMiddleware
 */
function getMonitor() {
    return bus.monitor;
}

export { addMonitorMiddleware, getMonitor, removeMonitorMiddleware };
