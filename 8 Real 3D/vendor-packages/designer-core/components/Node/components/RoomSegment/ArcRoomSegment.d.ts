import { ArcRoomSegmentConfig, SegmentType } from '../../../../declarations/Segment';
import { CoreDesigner } from '../../../../designer-core';
import Value from '../../../Value';
import { BaseRoomSegment } from '../../BaseRoomSegment';
export declare class ArcRoomSegment extends BaseRoomSegment<ArcRoomSegmentConfig> {
    readonly segmentType: SegmentType.arc;
    readonly clockwise: Value<boolean>;
    readonly radius: Value<number>;
    constructor(config: ArcRoomSegmentConfig, core: CoreDesigner);
    toJSON(): ArcRoomSegmentConfig;
}
