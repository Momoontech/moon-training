import { UUID } from '../../../declarations';
import { CoreDesigner } from '../../../designer-core';
declare const getParentRoomSegment: (core: CoreDesigner, nodeId: UUID | undefined) => import("../components/RoomSegment").RoomSegment;
export default getParentRoomSegment;
