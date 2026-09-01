import getNode from '../Node/helpers/getNode.js';

/**
 * Generic command for writing into a node's `properties` Map — the same
 * Map that `withProperties` produces for `Item` (`'isFinishEnd'`,
 * `'isFiller'`, `'freePartsNonSelectable'`, …), `Point`
 * (`'isLocked'`, `'isAngleLocked'`), `BoxContainer` (`'shelfShape'`),
 * `Model` (`'isScalable'`, `'isPositioned'`, `'isSizable'`), and that
 * `BaseRoomSegment` hand-rolls in the same shape for `'isLocked'`.
 *
 * Why this lives alongside `SetNodeAttributeValueCommand` and
 * `SetNodeSignalCommand`:
 *
 * - `SetNodeSignalCommand` writes top-level `Value<T>` instances on the
 *   node (e.g. `materialsSet`, `exists`).
 * - `SetNodeAttributeValueCommand` writes into `node.attributes` — an
 *   open-ended `Map<string, Value<AttributeValueType>>` whose entries
 *   may be created on demand.
 * - `SetNodePropertyValueCommand` (this) writes into `node.properties`
 *   — a closed Map whose keys are fixed at construction by
 *   `IPointPropertyNamesValues` / `IRoomSegmentPropertyNamesValues` /
 *   `IProductPropertyNamesValues` / etc. (see
 *   `declarations/Attributes.ts`). The Value instance is therefore
 *   always present for a valid property name; we never create new
 *   entries here.
 *
 * Falsy / guard branches:
 *
 * 1. `getNode` throws if the node is missing — matches every other
 *    `SetNode*Command` and is intentional: a missing nodeId is a
 *    caller bug, not a recoverable runtime state.
 * 2. The node has no `properties` Map → return `false`. Every node now
 *    inherits a metadata-seeded Map from `BaseNode`, so this branch is
 *    effectively unreachable for real nodes; it is kept as a defensive
 *    guard for non-node objects passed by mistake.
 * 3. The property name isn't declared in the node's property-names
 *    list (so the Map entry was never seeded — e.g. writing
 *    `'isFinishEnd'` to a `Stage`, which only carries the metadata
 *    keys) → return `false`.
 *
 * Undo:
 *
 * - Captures the previous **evaluated** value via `Value.get()`
 *   (matches `SetValueCommand` / `SetNodeAttributeValueCommand` /
 *   `SetNodeSignalCommand`). Properties currently hold primitives, not
 *   formula token arrays, so the evaluated value round-trips. If a
 *   future feature stores a formula on a property, switch to
 *   `Value.getSignal()` here in lockstep with the sibling commands.
 * - `hasPrevSnapshot` (not `prevValue !== undefined`) gates `undo` —
 *   `undefined` is a legitimate stored value (the Map is seeded with
 *   `core.createValue(undefined)` when the config field is absent), so
 *   the snapshot indicator must be independent of the captured value.
 */
class SetNodePropertyValueCommand {
    nodeId;
    propertyName;
    newValue;
    prevValue = undefined;
    hasPrevSnapshot = false;
    constructor(nodeId, propertyName, newValue) {
        this.nodeId = nodeId;
        this.propertyName = propertyName;
        this.newValue = newValue;
    }
    execute(core) {
        const node = getNode(core, this.nodeId);
        const properties = node.properties;
        if (!properties)
            return false;
        const property = properties.get(this.propertyName);
        if (!property)
            return false;
        this.prevValue = property.get();
        this.hasPrevSnapshot = true;
        property.set(this.newValue);
        return true;
    }
    undo(core) {
        if (!this.hasPrevSnapshot)
            return false;
        const node = getNode(core, this.nodeId);
        const properties = node.properties;
        if (!properties)
            return false;
        const property = properties.get(this.propertyName);
        if (!property)
            return false;
        property.set(this.prevValue);
        return true;
    }
}

export { SetNodePropertyValueCommand as default };
