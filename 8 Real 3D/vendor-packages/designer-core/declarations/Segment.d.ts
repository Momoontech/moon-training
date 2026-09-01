import { Catalog, IValue } from '../';
import { IAttributes } from './Attributes';
import { UUID } from './core';
import { NodeSharedConfig, NodeType } from './Node';
export declare enum SegmentType {
    linear = "linear",
    arc = "arc",
    bezier = "bezier"
}
export type RoomSegmentConfig = LinearRoomSegmentConfig | ArcRoomSegmentConfig | BezierRoomSegmentConfig;
type RoomSegmentShared = {
    type: NodeType.RoomSegment;
    exists?: IValue<number>;
    parent: UUID;
    attributes: IAttributes;
    wall2D: UUID | null;
    /**
     * Persisted lock state for this wall segment. When `true`, the segment
     * cannot be moved (perpendicular drag is blocked) and its length cannot
     * be edited at either endpoint — both `isCWDirectionDisabled` and
     * `isCCWDirectionDisabled` are forced on by the effective-lock helpers
     * (`getEffectiveSegmentLocked` → DimensionsUI), which also flips the
     * length input to read-only.
     *
     * Locking a segment additionally constrains the **endpoints'** effective
     * position-locked state: a corner whose two adjacent segments are both
     * locked has nowhere to move and nowhere to swing the angle, so
     * `getEffectivePointPositionLocked` and `getEffectivePointAngleLocked`
     * both treat it as locked even though the corner's own `isLocked` /
     * `isAngleLocked` flags remain `false`. The corner itself is unaffected
     * if only one of its adjacent segments is locked — in that case the
     * single-segment-anchor logic applies (the locked segment's far endpoint
     * still pins one arm; the other arm is free).
     *
     * Optional on the persisted shape — projects saved before the field
     * existed deserialise unchanged. At runtime the value is materialised
     * into `segment.properties` (see `IRoomSegmentPropertyNamesValues`)
     * by the hand-rolled `withProperties`-equivalent in `BaseRoomSegment`.
     * Mutated through
     * `SetNodePropertyValueCommand(segmentId, 'isLocked', next)` — the
     * preferred channel for `properties` writes (the same command covers
     * `Item`, `Point`, `Model`, `BoxContainer`, and this segment's
     * hand-rolled property Map). Never write the underlying `Value`
     * signal directly outside the command pipeline.
     */
    isLocked?: boolean;
};
export type LinearSegmentConfig = {
    segmentType: SegmentType.linear;
    from: UUID;
    to: UUID;
};
export type LinearRoomSegmentConfig = NodeSharedConfig & RoomSegmentShared & LinearSegmentConfig;
export type ArcSegmentConfig = {
    segmentType: SegmentType.arc;
    from: UUID;
    radius: number;
    to: UUID;
    clockwise?: boolean;
};
export type ArcRoomSegmentConfig = NodeSharedConfig & RoomSegmentShared & ArcSegmentConfig;
export type BezierSegmentConfig = {
    segmentType: SegmentType.bezier;
    from: UUID;
    to: UUID;
    point1: UUID;
};
export type BezierRoomSegmentConfig = NodeSharedConfig & RoomSegmentShared & BezierSegmentConfig;
export type RoomSegmentCatalogConfig = Catalog<RoomSegmentConfig>;
export {};
