/**
 * Tests for `SetMultiClosetSystemStatusCommand` — writes `state.name` on one entry of the reactive
 * `core.systemData` list, snapshotting the whole list for undo (the same shape as its sibling
 * `SetMultiClosetSystemNameCommand`).
 *
 * The `state`-less branch is not hypothetical: `AddMultiClosetSystemCommand` mints entries as
 * `{ id, name }` with no `state`, so the command has to leave those alone rather than synthesize
 * one (a status needs the `id` / `description` only the loaded blob supplies).
 */
export {};
