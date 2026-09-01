import { IValue, NodeSharedConfig, NodeType, UUID } from '../../declarations';
import { IAttributes } from '../../declarations/Attributes';
import { SegmentType } from '../../declarations/Segment';
import { CoreDesigner } from '../../designer-core';
import Value from '../Value';
import { BaseNode } from './BaseNode';
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
export declare abstract class BaseRoomSegment<TConfig extends NodeSharedConfig & {
    from: UUID;
    to: UUID;
    wall2D: UUID | null;
    attributes: IAttributes;
    exists?: IValue<number>;
    isLocked?: boolean;
}> extends BaseNode<TConfig, NodeType.RoomSegment> {
    /** Always `NodeType.RoomSegment` — shared across all three variants. */
    readonly type: NodeType.RoomSegment;
    /** Discriminates between linear / arc / bezier topology. */
    abstract readonly segmentType: SegmentType;
    /** Start point node ID. */
    readonly from: Value<UUID>;
    /** End point node ID. */
    readonly to: Value<UUID>;
    /**
     * Associated Wall2D node for this segment.
     * `null` when the segment has no wall yet.
     */
    readonly wall2D: Value<UUID | null>;
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
    constructor(config: TConfig, core: CoreDesigner);
    protected baseJSON(): {
        attributes: IAttributes;
        uuid: UUID;
        type: NodeType.RoomSegment;
        exists: IValue<number>;
        parent: UUID;
    };
}
