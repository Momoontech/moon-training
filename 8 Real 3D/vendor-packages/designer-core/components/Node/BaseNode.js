import disposeNode from './helpers/disposeNode.js';

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
class BaseNode {
    /** Unique identifier of this node in the scene graph. */
    id;
    /** Reference to the central state manager. */
    core;
    /**
     * Reactive parent reference.
     * @see getParent
     */
    parent;
    /**
     * Soft-delete flag. `1` = visible/active, `0` = hidden/removed.
     * Mutate only via a `Command` + `runCommandsAsTransaction`.
     */
    exists;
    /**
     * Registered side-effect cleanup functions.
     * Populated by `registerNodeEffects(this)` for nodes that opt in.
     */
    effects = [];
    /** Project-level cascading attributes for this node. */
    attributes = new Map();
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
    properties = new Map();
    constructor(config, core) {
        this.id = config.uuid;
        this.core = core;
        // registerNode must be called first — before any field initialization.
        // addNode is intentionally NOT called here; call it at the end of the concrete constructor.
        this.core.registerNode(this);
        const options = { nodeId: this.id };
        this.parent = core.createValue(config.parent, options);
        this.exists = core.createValue(config.exists ?? 1, options);
    }
    toJSON() {
        return this.baseJSON();
    }
    dispose() {
        disposeNode(this);
    }
    /**
     * Serialize the fields common to *every* node: uuid, type, exists, parent.
     * Spread into concrete `toJSON()` return values. The scalar `properties`
     * Map — including metadata keys such as `name` / `MVName` / `comment` — is
     * **not** emitted here; it is serialized by the `withProperties` `toJSON()`
     * override and the hand-rolled `baseJSON` overrides on `BaseModel` /
     * `BaseRoomSegment`, each of which spreads its own seeded `properties`
     * entries on top of this base object.
     */
    baseJSON() {
        return {
            uuid: this.id,
            type: this.type,
            exists: this.exists.getSignal(),
            parent: this.parent.get()
        };
    }
}

export { BaseNode };
