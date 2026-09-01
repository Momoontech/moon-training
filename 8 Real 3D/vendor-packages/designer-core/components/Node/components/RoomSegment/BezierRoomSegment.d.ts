import { UUID } from '../../../../declarations';
import { BezierRoomSegmentConfig, SegmentType } from '../../../../declarations/Segment';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
import { BaseRoomSegment } from '../../BaseRoomSegment';
export declare class BezierRoomSegment extends BaseRoomSegment<BezierRoomSegmentConfig> {
    readonly segmentType: SegmentType.bezier;
    readonly point1: Value<UUID>;
    constructor(config: BezierRoomSegmentConfig, core: CoreDesigner);
    toJSON(): BezierRoomSegmentConfig;
}
