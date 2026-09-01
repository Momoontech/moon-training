import { Snowflake } from '@sapphire/snowflake';
import { v7, v4 } from 'uuid';

/**
 * Central id factory for the whole scene graph.
 *
 * The id FORMAT is configurable — the app selects it explicitly via
 * `configureIdGenerator` (an app-owned choice), and the app itself never
 * branches on the format logic. Three strategies:
 *
 * - `'v4'` (default): a standard random UUID v4 string from the `uuid` package
 *   (`v4()`) — the original generator, unchanged. Maximum backward-compat with
 *   existing projects / backend.
 * - `'v7'`: a time-ordered UUID v7 string (RFC 9562) from the same `uuid`
 *   package — 48-bit big-endian unix-ms timestamp, version nibble `7`, then 74
 *   random bits. Still a canonical 36-char UUID, so any backend column already
 *   typed `uuid` / `char(36)` accepts it verbatim (unlike `'bigint'`), while
 *   lexicographic order matches creation order — which keeps B-tree index
 *   inserts local instead of scattering them the way v4 does. Not numeric, so
 *   the array-index caveat below does not apply.
 * - `'bigint'`: a client-side Snowflake from `@sapphire/snowflake`, minted as the
 *   decimal string of a 64-bit integer. With the 2020 epoch below the value fits
 *   a signed SQL `BIGINT` for decades and always stays > 2^32 (so numeric-string
 *   keys in object maps like `IObjects` keep insertion order, not array-index
 *   order). Caps at 4096 ids/ms per instance (the library wraps its increment
 *   rather than spin-waiting) — irrelevant here since ids are minted on discrete
 *   user actions, never thousands per millisecond.
 *
 * Regardless of format the value is an opaque branded `string` that round-trips
 * through JSON untouched. NEVER call `Number(id)` / `parseInt(id)` — a bigint id
 * exceeds the JS safe-integer range (2^53) and would silently corrupt.
 */
// -----------------------------------------------------------------------------
// bigint (Snowflake) strategy — @sapphire/snowflake
// -----------------------------------------------------------------------------
// 2020-01-01T00:00:00Z custom epoch. @sapphire layout: 42-bit timestamp | 5-bit
// worker | 5-bit process | 12-bit increment.
const snowflake = new Snowflake(1577836800000n);
// Random 10-bit worker/process seed so independent clients/tabs don't collide in
// the same millisecond; the library's increment handles same-instance ordering.
// Seeded once from WebCrypto (present in WKWebView + Node ≥20).
const seedBuffer = new Uint32Array(1);
globalThis.crypto.getRandomValues(seedBuffer);
const workerId = BigInt(seedBuffer[0] & 0b11111); // 5 bits
const processId = BigInt((seedBuffer[0] >>> 5) & 0b11111); // 5 bits
const bigintId = () => snowflake.generate({ workerId, processId }).toString();
// -----------------------------------------------------------------------------
// v4 strategy (default) — the original `uuid` package, unchanged from before the
// id-format work. Keeping the battle-tested library instead of a bespoke impl.
// -----------------------------------------------------------------------------
const v4Id = () => v4();
// -----------------------------------------------------------------------------
// v7 strategy — same `uuid` package. The library keeps a monotonic counter for
// ids minted inside the same millisecond, so a burst stays strictly increasing
// instead of shuffling within the ms.
// -----------------------------------------------------------------------------
const v7Id = () => v7();
// -----------------------------------------------------------------------------
// Configurable strategy
// -----------------------------------------------------------------------------
// Registry, not an if-chain: a new format is one entry here plus one member on
// `UuidType`, and `generateId` never changes.
const idGenerators = {
    v4: v4Id,
    v7: v7Id,
    bigint: bigintId
};
let strategy = 'v4';
/**
 * Select the id format for the whole runtime. Called once by the app with its
 * chosen format. Idempotent; safe to call again to switch.
 */
const configureIdGenerator = (type) => {
    strategy = type;
};
/** The currently configured id format. */
const getIdGeneratorType = () => strategy;
/**
 * Mint a fresh, unique id in the configured format. Returns the branded `UUID`
 * type (casts internally) so call sites no longer need to cast.
 */
// `?? v4Id` keeps the pre-registry behaviour for untyped (JS) callers that pass
// an unknown format string: fall back to the default rather than throwing.
const generateId = () => (idGenerators[strategy] ?? v4Id)();

export { configureIdGenerator, generateId, getIdGeneratorType };
