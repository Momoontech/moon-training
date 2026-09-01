import type { MoonTrackEvents } from './ITrackEvents';
export interface IMonitor {
    log(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, error?: Error | null, context?: Record<string, unknown>): void;
    debug(message: string, ...args: unknown[]): void;
    track<E extends keyof MoonTrackEvents>(event: E, properties: MoonTrackEvents[E]): void;
    track(event: string, properties?: Record<string, unknown>): void;
}
