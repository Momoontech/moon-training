import type { IMonitor } from '../declarations/IMonitor';
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
export declare function addMonitorMiddleware(middleware: IMonitor): void;
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
export declare function removeMonitorMiddleware(middleware: IMonitor): void;
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
export declare function getMonitor(): IMonitor;
