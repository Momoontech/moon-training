import type { UUID, UuidType } from '../declarations';
/**
 * Select the id format for the whole runtime. Called once by the app with its
 * chosen format. Idempotent; safe to call again to switch.
 */
export declare const configureIdGenerator: (type: UuidType) => void;
/** The currently configured id format. */
export declare const getIdGeneratorType: () => UuidType;
/**
 * Mint a fresh, unique id in the configured format. Returns the branded `UUID`
 * type (casts internally) so call sites no longer need to cast.
 */
export declare const generateId: () => UUID;
