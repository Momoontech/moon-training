import { Command } from '../../components/commands/core/Command';
import { UUID } from '../../declarations';
import { CoreDesigner } from '../../designer-core';
/**
 * The system a node contributes to, or `undefined` when it contributes to none.
 *
 * Only multiCloset Items carry a `system` reference, so every other node type — including a
 * multiCloset's own sections and parts — resolves to `undefined`. Uses `getOptionalNode`, so it is
 * safe to call against an id that has already been unregistered.
 */
export declare const getClosetSystemId: (core: CoreDesigner, nodeId: UUID) => UUID | undefined;
/**
 * `→ Plot` for the system of a freshly created closet, **from any status**. Carrying no system is
 * the only thing that suppresses the write — see the module doc above for why there is no status
 * guard here and what it costs.
 *
 * Consequences worth knowing before calling this:
 * - A system at `Design` / `Present` / `Signed` is pulled back to `Plot`.
 * - A command is returned even when the system id is missing from `core.systemData`, or its entry
 *   carries no `state` (as `AddMultiClosetSystemCommand`-minted entries do). Those cases are
 *   no-ops, but the no-op is enforced downstream by `SetMultiClosetSystemStatusCommand`'s own id /
 *   `state` guards — not here. Do not read a non-`null` return as "the status changed".
 *
 * Call once the node exists — it reads the node's `system` off the live scene graph.
 */
export declare const getSystemStatusCommandOnClosetAdded: (core: CoreDesigner, nodeId: UUID) => Command | null;
/**
 * `→ Draft` for a system whose last closet just left, from ANY status — an empty system is back to
 * a blank slate no matter how far it had progressed. Returns `null` while any closet remains, when
 * the system is already `Draft`, or when the entry carries no `state`.
 *
 * Call AFTER the node has been disposed: `getNodesBySystem` walks `core.nodeIds`, so a node that is
 * still registered would count itself and mask the last removal.
 */
export declare const getSystemStatusCommandOnClosetRemoved: (core: CoreDesigner, systemId: UUID) => Command | null;
