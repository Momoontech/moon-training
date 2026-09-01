import { LinearRoomSegmentConfig, SegmentType } from '../../../../declarations/Segment';
import { CoreDesigner } from '../../../../designer-core';
import { BaseRoomSegment } from '../../BaseRoomSegment';
export declare class LinearRoomSegment extends BaseRoomSegment<LinearRoomSegmentConfig> {
    readonly segmentType: SegmentType.linear;
    constructor(config: LinearRoomSegmentConfig, core: CoreDesigner);
    toJSON(): LinearRoomSegmentConfig;
}
