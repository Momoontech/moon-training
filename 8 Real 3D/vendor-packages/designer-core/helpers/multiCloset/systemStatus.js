import getNodesBySystem from '../../components/Node/helpers/getNodesBySystem.js';
import getOptionalNode from '../../components/Node/helpers/getOptionalNode.js';
import SetMultiClosetSystemStatusCommand from '../../components/commands/SetMultiClosetSystemStatusCommand.js';
import '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import { ItemType } from '../../declarations/helpers.js';
import '../../declarations/InterpretedLine.js';
import '../../declarations/Loader.js';
import '../../declarations/Model.js';
import '../../declarations/Molding.js';
import { NodeType } from '../../declarations/Node.js';
import '../../declarations/Panel.js';
import '../../declarations/PaperSpace.js';
import '../../declarations/Part.js';
import '../../declarations/ProjectSettings.js';
import '../../declarations/Segment.js';
import '../../declarations/SurfaceSettings.js';
import { SystemStatus } from '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';

/**
 * Occupancy-driven system status. A system's `state` tracks whether ANY multiCloset is assigned to
 * it. The two rules are deliberately NOT mirror images — read both before changing either:
 *
 * - a closet lands in a system → `Plot`, from ANY status ({@link getSystemStatusCommandOnClosetAdded})
 * - the LAST closet leaves a system → `Draft`, from any status ({@link getSystemStatusCommandOnClosetRemoved})
 *
 * **The add rule is intentionally unconditional on the current status.** It does not read the
 * system's `state` at all, so dropping a closet into a system that already reached `Design` /
 * `Present` / `Signed` pulls it back to `Plot`. Any closet drop re-opens the system's layout, and
 * the step-driven `updateSystemStatusEffect` (`designer-core.ts`) walks it forward again — that
 * effect owns `Plot → Design` (on `MobileStep.Catalog`) and `Design → Present` (on
 * `MobileStep.Present`). In practice: a drop on the Catalog step lands on `Plot` and is promoted
 * straight back to `Design`; a drop on a later step leaves the system at `Plot` until a step change
 * moves it on. If the rule should instead be "only advance a `Draft` system", the change is a
 * status guard in {@link getSystemStatusCommandOnClosetAdded} — it is absent on purpose, not by
 * omission, and `__tests__/helpers/multiCloset/systemStatus.test.ts` pins the current behaviour.
 *
 * The remove rule is the conditional one: it fires only once the system is genuinely empty, and it
 * skips a system already at `Draft`.
 *
 * Both helpers return a `Command` (or `null` when nothing needs to change) rather than mutating,
 * so the caller folds the status change into its own transaction — mirroring
 * `reconcileFreeBoxContainerBaysCommands` and `promoteMultiClosetAutoCarrier`. They are wired into
 * `CreateNodeFromCatalogCommand` and `RemoveNodeCommand`, which is every path by which a closet
 * carrying a `system` enters or leaves the scene.
 */
/** Current `state` of a system entry, or `undefined` when the entry or its `state` is absent. */
const getSystemStatus = (core, systemId) => core.systemData.peek().find((system) => system?.id === systemId)?.state;
/**
 * The system a node contributes to, or `undefined` when it contributes to none.
 *
 * Only multiCloset Items carry a `system` reference, so every other node type — including a
 * multiCloset's own sections and parts — resolves to `undefined`. Uses `getOptionalNode`, so it is
 * safe to call against an id that has already been unregistered.
 */
const getClosetSystemId = (core, nodeId) => {
    const node = getOptionalNode(core, nodeId);
    if (!node || node.type !== NodeType.Item)
        return undefined;
    if (node.itemType.get() !== ItemType.multiCloset)
        return undefined;
    return node.system?.get();
};
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
const getSystemStatusCommandOnClosetAdded = (core, nodeId) => {
    const systemId = getClosetSystemId(core, nodeId);
    if (!systemId)
        return null;
    return new SetMultiClosetSystemStatusCommand(systemId, SystemStatus.Plot);
};
/**
 * `→ Draft` for a system whose last closet just left, from ANY status — an empty system is back to
 * a blank slate no matter how far it had progressed. Returns `null` while any closet remains, when
 * the system is already `Draft`, or when the entry carries no `state`.
 *
 * Call AFTER the node has been disposed: `getNodesBySystem` walks `core.nodeIds`, so a node that is
 * still registered would count itself and mask the last removal.
 */
const getSystemStatusCommandOnClosetRemoved = (core, systemId) => {
    if (getNodesBySystem(core, systemId).length > 0)
        return null;
    const status = getSystemStatus(core, systemId);
    if (status === undefined || status === SystemStatus.Draft)
        return null;
    return new SetMultiClosetSystemStatusCommand(systemId, SystemStatus.Draft);
};

export { getClosetSystemId, getSystemStatusCommandOnClosetAdded, getSystemStatusCommandOnClosetRemoved };
