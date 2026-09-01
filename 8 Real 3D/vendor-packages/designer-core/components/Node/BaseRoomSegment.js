import { IRoomSegmentPropertyNamesValues } from '../../declarations/Attributes.js';
import '../../declarations/BoxContainer.js';
import '../../declarations/CoreDesigner.js';
import '../../declarations/Edgebanding.js';
import '../../declarations/FreeBoxContainer.js';
import '../../declarations/helpers.js';
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
import '../../declarations/systems.js';
import '../../declarations/UIAttributes.js';
import '../../declarations/Valance.js';
import '../../declarations/views.js';
import { BaseNode } from './BaseNode.js';
import { getNodeAttributesConfig } from './helpers/getNodeAttributesConfig.js';

/**
 * Shared base for all three room-segment variants (linear, arc, bezier).
 *
 * Handles: id, parent, exists, attributes, from, to, wall2D, plus the
 * `properties` Map (currently only `isLocked`) — the same shape that
 * the `withProperties` builder step produces for `Point` / `Item`.
 * Hand-rolled here because `BaseRoomSegment` is not assembled through
 * `NodeBuilder` (the segment subclasses extend it directly to add their
 * `segmentType`-specific fields), but the Map shape and the
 * `Object.fromEntries` serialization mirror the builder step exactly so
 * call sites read uniformly across node kinds.
 *
 * Each subclass declares `segmentType` as a const literal and adds its
 * unique fields.
 */
class BaseRoomSegment extends BaseNode {
    /** Always `NodeType.RoomSegment` — shared across all three variants. */
    type = NodeType.RoomSegment;
    /** Start point node ID. */
    from;
    /** End point node ID. */
    to;
    /**
     * Associated Wall2D node for this segment.
     * `null` when the segment has no wall yet.
     */
    wall2D;
    /**
     * Per-segment scalar properties driven by `IRoomSegmentPropertyNamesValues`.
     * Currently only `'isLocked'` lives here. Mirrors the shape of
     * `withProperties` (see `Point.properties`, `Item.properties`) so call
     * sites read uniformly: `segment.properties.get('isLocked')?.get()`.
     * Mutated through `SetNodePropertyValueCommand(segmentId, name, next)`
     * — the preferred channel for `properties` writes (the same command
     * covers `Item`, `Point`, and this hand-rolled segment Map). Never
     * write the underlying `Value` directly outside the command pipeline.
     * See {@link RoomSegmentShared.isLocked} for the full lock semantics.
     *
     * `BaseNode` leaves the Map empty; this class seeds its
     * `IRoomSegmentPropertyNamesValues` keys (currently only `isLocked`) into
     * the inherited Map — it carries no cross-cutting metadata keys and never
     * reassigns the Map.
     */
    constructor(config, core) {
        super(config, core);
        const options = { nodeId: this.id };
        const attrs = config.attributes;
        if (attrs) {
            for (const [key, value] of Object.entries(attrs)) {
                this.attributes.set(key, core.createValue(value, options));
            }
        }
        this.from = core.createValue(config.from, options);
        this.to = core.createValue(config.to, options);
        this.wall2D = core.createValue(config.wall2D, options);
        for (const name of IRoomSegmentPropertyNamesValues) {
            this.properties.set(name, core.createValue(config[name], options));
        }
    }
    baseJSON() {
        // Serialize this segment's own `properties` keys; `super.baseJSON`
        // (BaseNode) contributes the shared uuid/type/exists/parent fields.
        // RoomSegment carries no cross-cutting metadata keys.
        const props = Object.fromEntries(IRoomSegmentPropertyNamesValues.map((key) => [key, this.properties.get(key)?.get()]));
        return {
            ...super.baseJSON(),
            attributes: getNodeAttributesConfig(this),
            ...props
        };
    }
}

export { BaseRoomSegment };
