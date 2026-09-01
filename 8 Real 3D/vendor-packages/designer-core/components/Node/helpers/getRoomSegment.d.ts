import { CoreDesigner } from '../../../designer-core';
import { UUID } from '../../../declarations';
import { RoomSegment } from '../components/RoomSegment';
declare const getRoomSegment: (core: CoreDesigner, segmentId?: UUID | undefined | null) => RoomSegment;
export default getRoomSegment;
