import { NodeSharedConfig, NodeType, UUID } from '../../declarations';
import { CoreDesigner, NodeEffect } from '../../designer-core';
import { AttributeValue } from '../commands/SetProjectAttributeValueCommand';
import Value from '../Value';
/**
 * Base class for all scene-graph nodes.
 *
 * Constructor invariant:
 * - `core.registerNode(this)` is called **first** (before any field init) — in BaseNode constructor
 * - `core.addNode(this)` must be called **last** in the concrete leaf constructor — NOT here
 *
 * @typeParam TConfig - The serialized config shape for this node (e.g. `PanelConfig`)
 * @typeParam TType   - The `NodeType` literal for this node (e.g. `NodeType.Panel`)
 */
export declare abstract class BaseNode<TConfig extends NodeSharedConfig, TType extends NodeType> {
    /** Discriminator used for TypeScript union narrowing. Declared `as const` in each subclass. */
    abstract readonly type: TType;
    /** Unique identifier of this node in the scene graph. */
    readonly id: UUID;
    /** Reference to the central state manager. */
    readonly core: CoreDesigner;
    /**
     * Reactive parent reference.
     * @see getParent
     */
    readonly parent: Value<UUID>;
    /**
     * Soft-delete flag. `1` = visible/active, `0` = hidden/removed.
     * Mutate only via a `Command` + `runCommandsAsTransaction`.
     */
    readonly exists: Value<number>;
    /**
     * Registered side-effect cleanup functions.
     * Populated by `registerNodeEffects(this)` for nodes that opt in.
     */
    readonly effects: NodeEffect[];
    /** Project-level cascading attributes for this node. */
    readonly attributes: Map<string, Value<AttributeValue>>;
    /**
     * Scalar-property Map. `BaseNode` initializes it **empty** — it seeds no
     * keys itself. Each concrete node populates it with its own property set,
     * either through the `withProperties(namesValues)` builder step (`Item`,
     * `Point`, `BoxContainer`, `Panel` — note that step installs its own typed
     * Map) or a hand-rolled constructor loop (`BaseModel`, `BaseRoomSegment`).
     * The cross-cutting metadata keys `name` / `MVName` / `comment` come from
     * `INodePropertyNamesValues`, which is spread into the front of those
     * per-type name lists (`IProductPropertyNamesValues`,
     * `IPanelProperyNamesValues`, `IModelProperyNamesValues`, …); types whose
     * list omits it (`Point`, `RoomSegment`) intentionally carry no metadata
     * keys. Writes go through `SetNodePropertyValueCommand`.
     */
    readonly properties: Map<string, Value<string | number | boolean | undefined>>;
    constructor(config: TConfig, core: CoreDesigner);
    toJSON(): TConfig;
    dispose(): void;
    /**
     * Serialize the fields common to *every* node: uuid, type, exists, parent.
     * Spread into concrete `toJSON()` return values. The scalar `properties`
     * Map — including metadata keys such as `name` / `MVName` / `comment` — is
     * **not** emitted here; it is serialized by the `withProperties` `toJSON()`
     * override and the hand-rolled `baseJSON` overrides on `BaseModel` /
     * `BaseRoomSegment`, each of which spreads its own seeded `properties`
     * entries on top of this base object.
     */
    protected baseJSON(): {
        uuid: UUID;
        type: TType;
        exists: import("../..").IValue<number>;
        parent: UUID;
    };
}
