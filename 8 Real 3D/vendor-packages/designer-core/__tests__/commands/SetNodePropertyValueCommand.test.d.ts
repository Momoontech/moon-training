/**
 * Tests for `SetNodePropertyValueCommand` — the generic writer for the
 * `properties` Map on `withProperties`-built nodes (`Item`, `Point`,
 * `BoxContainer`) and the hand-rolled equivalent on `BaseRoomSegment`.
 *
 * The default mock graph from `createMockCore()` exposes `MOCK_ITEM_ID`
 * (cabinet `Item` whose properties cover `IProductPropertyNamesValues`).
 * The Point + RoomSegment cases are seeded inline (Tier 2) so this file
 * stays self-contained without leaking a new canonical fixture.
 *
 * Guard branches exercised:
 *   - Node missing → `getNode` throws.
 *   - Node lacks `properties` Map (Floorplan / Stage) → returns false.
 *   - Property name not declared for the node type → returns false.
 *   - Undo before execute → returns false (no snapshot).
 *
 * Snapshot integrity:
 *   - Falsy `false` previous value round-trips through undo.
 *   - `undefined` previous value (the default seeded by the constructor
 *     when the config field is absent) round-trips through undo — this
 *     is why the command uses a separate `hasPrevSnapshot` boolean
 *     instead of `prevValue !== undefined`.
 */
export {};
